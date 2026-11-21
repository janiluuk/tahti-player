import { render, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthUser } from '../api/types';
import { readOAuthReturn } from '../lib/oauthReturn';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { OAuthReturnHandler } from './OAuthReturnHandler';

const navigate = vi.fn();

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => navigate,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const signedInUser = {
  id: 'u1',
  email: '',
  username: 'liina',
  displayName: 'Liina',
} as AuthUser;

describe('readOAuthReturn', () => {
  it('keeps other params when removing the oauth ones', () => {
    expect(readOAuthReturn('?tab=devices&oauth=ok')).toEqual({
      kind: 'ok',
      search: '?tab=devices',
    });
    expect(readOAuthReturn('?oauth_error=nope')).toEqual({
      kind: 'error',
      code: 'failed',
      search: '',
    });
    expect(readOAuthReturn('?tab=devices')).toBeNull();
  });

  it('reads email_required as its own code', () => {
    expect(readOAuthReturn('?oauth_error=email_required&tab=x')).toEqual({
      kind: 'error',
      code: 'email_required',
      search: '?tab=x',
    });
  });

  it('reads the two-factor challenge and strips it', () => {
    expect(readOAuthReturn('?t=30&oauth=totp&challengeId=ch-1')).toEqual({
      kind: 'totp',
      challengeId: 'ch-1',
      search: '?t=30',
    });
    expect(readOAuthReturn('?oauth=totp')).toEqual({
      kind: 'error',
      code: 'failed',
      search: '',
    });
  });
});

describe('OAuthReturnHandler', () => {
  beforeEach(() => {
    navigate.mockReset();
    sessionStorage.clear();
    useAuthModalStore.setState({
      isOpen: false,
      mode: 'login',
      oauthError: null,
    });
    useAuthStore.setState({ user: null, refresh: vi.fn(async () => {}) });
  });

  afterEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, '', '/');
  });

  it('does nothing without return params', () => {
    window.history.replaceState(null, '', '/feed?tab=new');
    render(<OAuthReturnHandler />);
    expect(navigate).not.toHaveBeenCalled();
    expect(useAuthStore.getState().refresh).not.toHaveBeenCalled();
  });

  it('refreshes the session on oauth=ok, strips the param and names the provider', async () => {
    sessionStorage.setItem(
      'tahti-oauth-pending',
      JSON.stringify({ provider: 'google', link: false }),
    );
    const refresh = vi.fn(async () => {
      useAuthStore.setState({ user: signedInUser });
    });
    useAuthStore.setState({ refresh });
    window.history.replaceState(null, '', '/release/nova?t=30&oauth=ok#c');

    render(<OAuthReturnHandler />);

    expect(navigate).toHaveBeenCalledWith({
      href: '/release/nova?t=30#c',
      replace: true,
    });
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Signed in with Google'),
    );
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('tahti-oauth-pending')).toBeNull();
  });

  it('confirms a link started from Settings', async () => {
    sessionStorage.setItem(
      'tahti-oauth-pending',
      JSON.stringify({ provider: 'facebook', link: true }),
    );
    useAuthStore.setState({
      user: signedInUser,
      refresh: vi.fn(async () => {}),
    });
    window.history.replaceState(null, '', '/settings/security?oauth=ok');
    render(<OAuthReturnHandler />);
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Facebook is now linked to your account.',
      ),
    );
  });

  it('opens the two-factor step for an account with 2FA', () => {
    window.history.replaceState(
      null,
      '',
      '/release/x?oauth=totp&challengeId=ch-9',
    );
    render(<OAuthReturnHandler />);
    expect(useAuthStore.getState().totpChallengeId).toBe('ch-9');
    expect(useAuthModalStore.getState().isOpen).toBe(true);
    expect(useAuthModalStore.getState().mode).toBe('login');
    expect(navigate).toHaveBeenCalledWith({
      href: '/release/x',
      replace: true,
    });
    expect(useAuthStore.getState().refresh).not.toHaveBeenCalled();
  });

  it('opens the dialog with failed when no session came back', async () => {
    window.history.replaceState(null, '', '/?oauth=ok');
    render(<OAuthReturnHandler />);
    await waitFor(() =>
      expect(useAuthModalStore.getState().oauthError).toBe('failed'),
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it.each([
    'cancelled',
    'email_in_use',
    'already_linked',
    'not_configured',
    'email_required',
    'failed',
  ] as const)(
    'opens the auth dialog for oauth_error=%s and strips it',
    (code) => {
      window.history.replaceState(null, '', `/?oauth_error=${code}`);
      render(<OAuthReturnHandler />);
      expect(navigate).toHaveBeenCalledWith({ href: '/', replace: true });
      const modal = useAuthModalStore.getState();
      expect(modal.isOpen).toBe(true);
      expect(modal.mode).toBe('login');
      expect(modal.oauthError).toBe(code);
      expect(useAuthStore.getState().refresh).not.toHaveBeenCalled();
    },
  );

  it('toasts the error instead when already signed in', () => {
    useAuthStore.setState({ user: signedInUser });
    window.history.replaceState(null, '', '/?oauth_error=already_linked');
    render(<OAuthReturnHandler />);
    expect(toast.error).toHaveBeenCalledWith(
      'That Google or Facebook account is already linked to another Tahti account.',
    );
    expect(useAuthModalStore.getState().isOpen).toBe(false);
  });

  it('explains a Facebook sign-in without an email', () => {
    useAuthStore.setState({ user: signedInUser });
    window.history.replaceState(null, '', '/?oauth_error=email_required');
    render(<OAuthReturnHandler />);
    expect(toast.error).toHaveBeenCalledWith(
      "Facebook didn't share an email address. Allow email access when signing in with Facebook, or sign up with email.",
    );
  });
});
