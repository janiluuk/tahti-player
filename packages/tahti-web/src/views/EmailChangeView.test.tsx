import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/account-credentials';
import type { AuthUser } from '../api/types';
import { useAuthStore } from '../stores/authStore';
import { EmailChangeView } from './EmailChangeView';

vi.mock('@tahti-player/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tahti-player/ui')>()),
  ButtonLink: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => <a data-variant={variant ?? 'default'}>{children}</a>,
}));

function openWith(search: string) {
  window.history.replaceState({}, '', `/email-change${search}`);
}

describe('EmailChangeView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('confirms the token from the link', async () => {
    openWith('?token=abc');
    const confirm = vi.spyOn(api, 'confirmEmailChange').mockResolvedValue({
      ok: true,
      message: 'Your account now uses new@example.com.',
    });
    await act(async () => {
      render(<EmailChangeView />);
    });
    expect(confirm).toHaveBeenCalledWith('abc');
    expect(screen.getByRole('heading', { name: 'Email changed' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe(
      'Your account now uses new@example.com.',
    );
    expect(screen.getByText('Sign in').dataset.variant).toBe('default');
  });

  it('sends a signed-in member back to Settings with a secondary link', async () => {
    openWith('?token=abc');
    useAuthStore.setState({ user: { username: 'aino' } as AuthUser });
    vi.spyOn(api, 'confirmEmailChange').mockResolvedValue({
      ok: true,
      message: 'Your account now uses a new address.',
    });
    await act(async () => {
      render(<EmailChangeView />);
    });
    expect(screen.getByText('Back to Settings').dataset.variant).toBe(
      'secondary',
    );
    useAuthStore.setState({ user: null });
  });

  it('explains an expired or used link', async () => {
    openWith('?token=old');
    vi.spyOn(api, 'confirmEmailChange').mockResolvedValue({
      ok: false,
      error: 'Invalid or expired link',
    });
    await act(async () => {
      render(<EmailChangeView />);
    });
    expect(screen.getByText('Invalid or expired link')).toBeTruthy();
    expect(
      screen.getByText(/Links work once and expire after 24 hours/),
    ).toBeTruthy();
  });
});
