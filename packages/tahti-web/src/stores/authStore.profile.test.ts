import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthUser } from '../api/types';

const api = vi.hoisted(() => ({
  fetchAuthMe: vi.fn(),
  loginRequest: vi.fn(),
  logoutRequest: vi.fn(async () => undefined),
}));

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  fetchAuthMe: api.fetchAuthMe,
  loginRequest: api.loginRequest,
  logoutRequest: api.logoutRequest,
}));

vi.mock('./libraryStore', () => ({
  rehydrateLibraryForUser: vi.fn(async () => undefined),
  useLibraryStore: {
    getState: () => ({ mergeServerFollowing: vi.fn(async () => undefined) }),
  },
}));

const { PROFILE_BACKGROUND_RETRY_MS, PROFILE_RETRY_DELAYS_MS, useAuthStore } =
  await import('./authStore');

const summary: AuthUser = {
  id: 'u1',
  email: 'yaniho@example.com',
  username: 'yaniho',
  displayName: 'Yaniho',
  tier: 'STUDIO',
};

const profile: AuthUser = {
  ...summary,
  channel: { slug: 'yaniho', state: 'LIVE' },
};

const ok = (data: AuthUser) => ({ data, meta: { source: 'api' } });
const failure = { data: null, meta: { source: 'api', reason: 'HTTP 500' } };
const signedOut = { data: null, meta: { source: 'api' } };

describe('auth store profile loading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    api.fetchAuthMe.mockReset();
    api.loginRequest.mockReset();
    api.loginRequest.mockResolvedValue({ ok: true, user: summary });
    useAuthStore.setState({
      user: null,
      profileLoaded: false,
      hydrated: true,
      loading: false,
      error: null,
    });
  });

  afterEach(async () => {
    vi.useRealTimers();
    await useAuthStore.getState().logout();
  });

  const login = async () => {
    const pending = useAuthStore.getState().login('yaniho@example.com', 'pw');
    await vi.advanceTimersByTimeAsync(
      PROFILE_RETRY_DELAYS_MS.reduce((total, ms) => total + ms, 0),
    );
    await pending;
  };

  it('uses the full profile, with the channel, after signing in', async () => {
    api.fetchAuthMe.mockResolvedValue(ok(profile));
    await login();
    expect(useAuthStore.getState().user?.channel?.slug).toBe('yaniho');
    expect(useAuthStore.getState().profileLoaded).toBe(true);
  });

  it('retries the profile when the first request after sign-in fails', async () => {
    api.fetchAuthMe
      .mockResolvedValueOnce(failure)
      .mockResolvedValueOnce(failure)
      .mockResolvedValueOnce(ok(profile));
    await login();
    expect(api.fetchAuthMe).toHaveBeenCalledTimes(3);
    expect(useAuthStore.getState().user?.channel?.slug).toBe('yaniho');
    expect(useAuthStore.getState().profileLoaded).toBe(true);
  });

  it('never treats the login summary as "no channel", and keeps a known channel', async () => {
    useAuthStore.setState({ user: profile });
    api.fetchAuthMe.mockResolvedValue(failure);
    await login();
    const state = useAuthStore.getState();
    expect(state.profileLoaded).toBe(false);
    expect(state.user?.channel?.slug).toBe('yaniho');
  });

  it('keeps trying in the background until the profile loads', async () => {
    api.fetchAuthMe.mockResolvedValue(failure);
    await login();
    expect(useAuthStore.getState().profileLoaded).toBe(false);
    api.fetchAuthMe.mockResolvedValue(ok(profile));
    await vi.advanceTimersByTimeAsync(PROFILE_BACKGROUND_RETRY_MS);
    expect(useAuthStore.getState().profileLoaded).toBe(true);
    expect(useAuthStore.getState().user?.channel?.slug).toBe('yaniho');
  });

  it('does not retry a 401: that is a signed-out session', async () => {
    useAuthStore.setState({ user: profile });
    api.fetchAuthMe.mockResolvedValue(signedOut);
    await useAuthStore.getState().refresh();
    expect(api.fetchAuthMe).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
