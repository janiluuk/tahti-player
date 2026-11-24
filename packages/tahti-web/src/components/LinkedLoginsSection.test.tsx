import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchOAuthAccounts,
  fetchOAuthProviders,
  unlinkOAuthAccount,
} from '../api/oauth';
import type { AuthUser } from '../api/types';
import { useAuthStore } from '../stores/authStore';
import { LinkedLoginsSection } from './LinkedLoginsSection';
import { resetOAuthProvidersForTests } from './OAuthSignInButtons';

vi.mock('../api/oauth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/oauth')>()),
  fetchOAuthProviders: vi.fn(),
  fetchOAuthAccounts: vi.fn(),
  unlinkOAuthAccount: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const HINT = 'Set a password first to disconnect your only way to sign in.';

const user = {
  id: 'u1',
  email: 'liina@gmail.com',
  username: 'liina',
  displayName: 'Liina',
} as AuthUser;

describe('LinkedLoginsSection', () => {
  beforeEach(() => {
    useAuthStore.setState({ user });
    resetOAuthProvidersForTests();
    vi.mocked(fetchOAuthProviders).mockResolvedValue({
      data: ['google', 'facebook'],
      meta: { source: 'api' },
    });
    vi.mocked(fetchOAuthAccounts).mockResolvedValue({
      data: [
        {
          provider: 'google',
          email: 'liina@gmail.com',
          linkedAt: '2026-10-02T09:30:00.000Z',
        },
      ],
      meta: { source: 'api' },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists each provider with its status', async () => {
    render(<LinkedLoginsSection />);
    expect(
      await screen.findByRole('heading', { name: 'Linked logins' }),
    ).toBeVisible();
    expect(await screen.findByText('liina@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('Not linked')).toHaveClass('rounded-full');
    expect(screen.getByText('Linked')).toHaveClass('rounded-full');
    expect(
      screen.getByRole('button', { name: 'Disconnect Google' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Link Facebook' })).toBeVisible();
  });

  it('links by starting the provider with link=1 and a return to Security', async () => {
    const assign = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      assign,
    });
    render(<LinkedLoginsSection />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Link Facebook' }),
    );
    expect(assign).toHaveBeenCalledWith(
      expect.stringMatching(
        /\/api\/auth\/oauth\/facebook\/start\?returnTo=%2Fsettings%2Fsecurity&link=1$/,
      ),
    );
  });

  it('disconnects after confirming', async () => {
    vi.mocked(unlinkOAuthAccount).mockResolvedValue({ ok: true });
    render(<LinkedLoginsSection />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Disconnect Google' }),
    );
    expect(await screen.findByText('Disconnect Google?')).toBeVisible();
    vi.mocked(fetchOAuthAccounts).mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
    await waitFor(() =>
      expect(unlinkOAuthAccount).toHaveBeenCalledWith('google'),
    );
    await waitFor(() =>
      expect(screen.getAllByText('Not linked')).toHaveLength(2),
    );
  });

  it('shows the 409 message when it is the last way to sign in', async () => {
    vi.mocked(unlinkOAuthAccount).mockResolvedValue({
      ok: false,
      error: 'Set a password before disconnecting your only login.',
    });
    render(<LinkedLoginsSection />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Disconnect Google' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Disconnect' }));
    expect(
      await screen.findByText(
        'Set a password before disconnecting your only login.',
      ),
    ).toBeVisible();
    expect(screen.getByText('liina@gmail.com')).toBeInTheDocument();
  });

  it('renders nothing when no provider is configured or linked', async () => {
    vi.mocked(fetchOAuthProviders).mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    vi.mocked(fetchOAuthAccounts).mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    const { container } = render(<LinkedLoginsSection />);
    await waitFor(() => expect(fetchOAuthAccounts).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('hints that a password comes first when the only login has no password', async () => {
    useAuthStore.setState({ user: { ...user, hasPassword: false } });
    render(<LinkedLoginsSection />);
    expect(await screen.findByText(HINT)).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Disconnect Google' }),
    ).toBeEnabled();
  });

  it('shows no hint with a password, a missing hasPassword or two logins', async () => {
    useAuthStore.setState({ user: { ...user, hasPassword: true } });
    const { unmount } = render(<LinkedLoginsSection />);
    await screen.findByText('liina@gmail.com');
    expect(screen.queryByText(HINT)).toBeNull();
    unmount();

    useAuthStore.setState({ user });
    const second = render(<LinkedLoginsSection />);
    await screen.findByText('liina@gmail.com');
    expect(screen.queryByText(HINT)).toBeNull();
    second.unmount();

    useAuthStore.setState({ user: { ...user, hasPassword: false } });
    vi.mocked(fetchOAuthAccounts).mockResolvedValue({
      data: [
        { provider: 'google', email: null, linkedAt: '2026-10-02T09:30:00Z' },
        { provider: 'facebook', email: null, linkedAt: '2026-10-03T09:30:00Z' },
      ],
      meta: { source: 'api' },
    });
    render(<LinkedLoginsSection />);
    expect(await screen.findAllByText('Linked')).toHaveLength(2);
    expect(screen.queryByText(HINT)).toBeNull();
  });
});
