import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  fetchAuthMe,
  loginRequest,
  loginTotpRequest,
  logoutRequest,
  registerRequest,
  submitForgotPassword,
  submitResetPassword,
  submitSetupPassword,
  verifyEmailRequest,
} from '../api/client';
import { setMockSessionUser } from '../api/mock-session';
import type { AuthUser } from '../api/types';
import { rehydrateLibraryForUser, useLibraryStore } from './libraryStore';

type AuthState = {
  user: AuthUser | null;
  /**
   * True once `user` came from `/api/auth/me` in this page session. Until
   * then `user` may be the login summary or a persisted copy that lacks
   * `channel` and `storage`, so "has no channel" must not be concluded.
   */
  profileLoaded: boolean;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  totpChallengeId: string | null;
  refresh: () => Promise<void>;
  login: (
    email: string,
    password: string,
  ) => Promise<{ requiresTotp?: boolean; challengeId?: string }>;
  completeTotp: (code: string) => Promise<void>;
  cancelTotp: () => void;
  register: (input: {
    email: string;
    password: string;
    username: string;
    displayName: string;
  }) => Promise<string>;
  verify: (token: string) => Promise<string>;
  setupPassword: (
    token: string,
    password: string,
    email?: string,
  ) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (
    token: string,
    password: string,
    email?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

let sessionMutationVersion = 0;

/** Waits between the retries of `/api/auth/me` right after signing in. */
export const PROFILE_RETRY_DELAYS_MS = [300, 1000, 3000];
/** How often a missing profile is fetched again in the background. */
export const PROFILE_BACKGROUND_RETRY_MS = 30_000;

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * `/api/auth/me` with retries on errors (not on 401, which means signed out).
 * Returns `null` when the profile could not be loaded.
 */
async function fetchProfile(): Promise<AuthUser | null> {
  for (let attempt = 0; ; attempt += 1) {
    const { data, meta } = await fetchAuthMe();
    if (data) {
      return data;
    }
    const delay = PROFILE_RETRY_DELAYS_MS[attempt];
    if (!meta.reason || delay === undefined) {
      return null;
    }
    await wait(delay);
  }
}

/** The login response is a summary; keep what a previous full profile of the same user knew. */
function withKnownProfile(
  summary: AuthUser,
  previous: AuthUser | null,
): AuthUser {
  return previous && previous.id === summary.id
    ? { ...previous, ...summary }
    : summary;
}

let backgroundRetry: ReturnType<typeof setTimeout> | null = null;

function stopProfileRetry() {
  if (backgroundRetry) {
    clearTimeout(backgroundRetry);
    backgroundRetry = null;
  }
}

async function afterUserChange(user: AuthUser | null) {
  await rehydrateLibraryForUser(user?.id ?? null);
  if (user?.username) {
    await useLibraryStore.getState().mergeServerFollowing(user.username);
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      /** Signed in: load the full profile; fall back to the summary only as a placeholder. */
      const applySignedIn = async (summary: AuthUser) => {
        const profile = await fetchProfile();
        const user = profile ?? withKnownProfile(summary, get().user);
        set({
          user,
          profileLoaded: Boolean(profile),
          loading: false,
          error: null,
          totpChallengeId: null,
        });
        if (profile) {
          stopProfileRetry();
        } else {
          scheduleProfileRetry();
        }
        await afterUserChange(user);
      };

      const scheduleProfileRetry = () => {
        if (backgroundRetry || typeof window === 'undefined') {
          return;
        }
        backgroundRetry = setTimeout(() => {
          backgroundRetry = null;
          if (get().user && !get().profileLoaded) {
            void get().refresh();
          }
        }, PROFILE_BACKGROUND_RETRY_MS);
      };

      return {
        user: null,
        profileLoaded: false,
        hydrated: false,
        loading: false,
        error: null,
        totpChallengeId: null,

        clearError: () => set({ error: null }),

        cancelTotp: () => set({ totpChallengeId: null, error: null }),

        refresh: async () => {
          const refreshVersion = sessionMutationVersion;
          set({ loading: true, error: null });
          try {
            const { data, meta } = await fetchAuthMe();
            if (refreshVersion !== sessionMutationVersion) {
              set({ loading: false, hydrated: true });
              return;
            }
            if (data) {
              stopProfileRetry();
              set({
                user: data,
                profileLoaded: true,
                loading: false,
                hydrated: true,
              });
              await afterUserChange(data);
              return;
            }
            // Rehydrate in-memory mock session from persisted zustand user
            if (import.meta.env.VITE_FORCE_MOCK === '1' && get().user) {
              setMockSessionUser(get().user);
              set({ profileLoaded: true, loading: false, hydrated: true });
              await afterUserChange(get().user);
              return;
            }
            if (meta.reason && get().user) {
              set({ profileLoaded: false, loading: false, hydrated: true });
              scheduleProfileRetry();
              return;
            }
            stopProfileRetry();
            set({
              user: null,
              profileLoaded: false,
              loading: false,
              hydrated: true,
            });
            await afterUserChange(null);
          } catch {
            set({ loading: false, hydrated: true });
          }
        },

        login: async (email, password) => {
          sessionMutationVersion += 1;
          set({ loading: true, error: null, totpChallengeId: null });
          const result = await loginRequest(email, password);
          if (!result.ok) {
            set({ loading: false, error: result.error });
            throw new Error(result.error);
          }
          if ('requiresTotp' in result && result.requiresTotp) {
            set({
              loading: false,
              error: null,
              totpChallengeId: result.challengeId ?? null,
            });
            return { requiresTotp: true, challengeId: result.challengeId };
          }
          await applySignedIn(result.user);
          return {};
        },

        completeTotp: async (code) => {
          sessionMutationVersion += 1;
          const challengeId = get().totpChallengeId;
          if (!challengeId) {
            set({ error: 'No TOTP challenge — sign in again.' });
            throw new Error('No TOTP challenge');
          }
          set({ loading: true, error: null });
          const result = await loginTotpRequest(challengeId, code);
          if (!result.ok) {
            set({ loading: false, error: result.error });
            throw new Error(result.error);
          }
          await applySignedIn(result.user);
        },

        register: async (input) => {
          set({ loading: true, error: null });
          const result = await registerRequest(input);
          set({ loading: false });
          if (!result.ok) {
            set({ error: result.error });
            throw new Error(result.error);
          }
          return result.message;
        },

        verify: async (token) => {
          set({ loading: true, error: null });
          const result = await verifyEmailRequest(token);
          set({ loading: false });
          if (!result.ok) {
            set({ error: result.error });
            throw new Error(result.error);
          }
          return result.message;
        },

        setupPassword: async (token, password, email) => {
          set({ loading: true, error: null });
          const result = await submitSetupPassword(token, password, email);
          if (!result.ok) {
            set({ loading: false, error: result.error });
            throw new Error(result.error);
          }
          await applySignedIn(result.user);
        },

        forgotPassword: async (email) => {
          set({ loading: true, error: null });
          const message = await submitForgotPassword(email);
          set({ loading: false });
          return message;
        },

        resetPassword: async (token, password, email) => {
          set({ loading: true, error: null });
          const result = await submitResetPassword(token, password, email);
          if (!result.ok) {
            set({ loading: false, error: result.error });
            throw new Error(result.error);
          }
          await applySignedIn(result.user);
        },

        logout: async () => {
          sessionMutationVersion += 1;
          await logoutRequest();
          stopProfileRetry();
          set({
            user: null,
            profileLoaded: false,
            error: null,
            totpChallengeId: null,
          });
          await afterUserChange(null);
        },
      };
    },
    {
      name: 'tahti-web-auth',
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => {
        state?.refresh();
      },
    },
  ),
);
