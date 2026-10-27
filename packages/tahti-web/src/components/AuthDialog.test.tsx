import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { AuthDialog } from './AuthDialog';

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
  beforeEach(() => {
    useAuthModalStore.setState({ isOpen: true, mode: 'login' });
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
});
