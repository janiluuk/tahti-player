import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchOAuthProviders, type OAuthProvider } from '../api/oauth';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { AuthDialog } from './AuthDialog';
import { resetOAuthProvidersForTests } from './OAuthSignInButtons';

vi.mock('../api/oauth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/oauth')>()),
  fetchOAuthProviders: vi.fn(),
}));

function providersAre(providers: OAuthProvider[]) {
  vi.mocked(fetchOAuthProviders).mockResolvedValue({
    data: providers,
    meta: { source: 'api' },
  });
}

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    onClick?: () => void;
  }) => (
    <a href={props.to} onClick={props.onClick}>
      {children}
    </a>
  ),
}));

describe('AuthDialog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    resetOAuthProvidersForTests();
    providersAre([]);
    useAuthModalStore.setState({
      isOpen: true,
      mode: 'login',
      oauthError: null,
    });
    useAuthStore.setState({
      loading: false,
      error: 'Invalid credentials',
      totpChallengeId: null,
      user: null,
      clearError: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      completeTotp: vi.fn(),
      cancelTotp: vi.fn(),
    });
  });

  it('exposes login errors with aria-live', () => {
    render(<AuthDialog />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
    expect(alert).toHaveTextContent('Invalid credentials');
  });

  it('exposes password mismatch on join with aria-live', () => {
    useAuthModalStore.setState({ mode: 'join' });
    useAuthStore.setState({ error: null });
    render(<AuthDialog />);
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Password-A1' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'Password-B1' },
    });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
    expect(alert).toHaveTextContent('Passwords do not match.');
  });

  it('accepts a backup code for a two-factor login challenge', () => {
    const completeTotp = vi.fn(async () => undefined);
    useAuthStore.setState({
      error: null,
      totpChallengeId: 'challenge-1',
      completeTotp,
    });
    render(<AuthDialog />);

    expect(
      screen.getByText(/authenticator app or a backup code/),
    ).toBeVisible();
    fireEvent.change(screen.getByLabelText('Authentication or backup code'), {
      target: { value: 'ABCD-1111' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }));

    expect(completeTotp).toHaveBeenCalledWith('ABCD-1111');
  });

  it('names the password rule a new password breaks', () => {
    useAuthModalStore.setState({ mode: 'join' });
    useAuthStore.setState({ error: null });
    render(<AuthDialog />);
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password-a' },
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Add an uppercase letter.',
    );
  });

  it('opens a check-your-email modal after registration succeeds', async () => {
    const register = vi.fn(async () => 'ok');
    useAuthModalStore.setState({ mode: 'join' });
    useAuthStore.setState({ error: null, register });
    render(<AuthDialog />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Artist name'), {
      target: { value: 'Nova' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Password-A1' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'Password-A1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(register).toHaveBeenCalled();
    expect(
      await screen.findByRole('heading', { name: /Check your email/i }),
    ).toBeVisible();
    expect(
      screen.getByText(/We sent a verification link to new@example.com/),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Got it' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Create account' })).toBeNull();
  });

  it('groups join fields under account and password sections', () => {
    useAuthModalStore.setState({ mode: 'join' });
    useAuthStore.setState({ error: null });
    render(<AuthDialog />);

    expect(screen.getByRole('heading', { name: 'Your account' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Password' })).toBeVisible();
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password-a' },
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Add an uppercase letter.',
    );
  });

  it.each([
    [['google', 'facebook'] as OAuthProvider[], 'login' as const],
    [['facebook'] as OAuthProvider[], 'join' as const],
  ])('offers the providers the API lists (%j, %s)', async (providers, mode) => {
    providersAre(providers);
    useAuthModalStore.setState({ mode });
    useAuthStore.setState({ error: null });
    render(<AuthDialog />);

    expect(
      await screen.findByRole('button', { name: 'Continue with Facebook' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Continue with Google' }) !== null,
    ).toBe(providers.includes('google'));
    expect(screen.getByRole('separator', { name: 'or' })).toBeVisible();
  });

  it('shows no provider buttons or divider when none are configured', async () => {
    useAuthStore.setState({ error: null });
    render(<AuthDialog />);
    await screen.findByRole('button', { name: 'Sign in' });
    await Promise.resolve();
    expect(screen.queryByRole('button', { name: /Continue with/ })).toBeNull();
    expect(screen.queryByRole('separator', { name: 'or' })).toBeNull();
  });

  it('starts the provider sign-in with the current page as returnTo', async () => {
    providersAre(['google']);
    useAuthStore.setState({ error: null });
    const assign = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      pathname: '/release/nova',
      search: '?t=30',
      assign,
    });
    render(<AuthDialog />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Continue with Google' }),
    );
    expect(assign).toHaveBeenCalledWith(
      expect.stringContaining(
        '/api/auth/oauth/google/start?returnTo=%2Frelease%2Fnova%3Ft%3D30',
      ),
    );
  });

  it('explains an email_in_use return inline', () => {
    useAuthStore.setState({ error: null });
    useAuthModalStore.getState().openWithOAuthError('email_in_use');
    render(<AuthDialog />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'An account with this email already exists. Sign in with your password, then link Google/Facebook in Settings → Security.',
    );
  });
});
