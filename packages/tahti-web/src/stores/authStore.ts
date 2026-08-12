import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  fetchAuthMe,
  loginRequest,
  loginTotpRequest,
  logoutRequest,
  registerRequest,
  verifyEmailRequest,
} from '../api/client';
import { setMockSessionUser } from '../api/mock-session';
import type { AuthUser } from '../api/types';
import { rehydrateLibraryForUser, useLibraryStore } from './libraryStore';

type AuthState = {
  user: AuthUser | null;
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
  logout: () => Promise<void>;
  clearError: () => void;
};

async function afterUserChange(user: AuthUser | null) {
  await rehydrateLibraryForUser(user?.id ?? null);
  if (user?.username) {
    await useLibraryStore.getState().mergeServerFollowing(user.username);
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      hydrated: false,
      loading: false,
      error: null,
      totpChallengeId: null,

      clearError: () => set({ error: null }),

      cancelTotp: () => set({ totpChallengeId: null, error: null }),

      refresh: async () => {
        set({ loading: true, error: null });
        try {
          const { data } = await fetchAuthMe();
          if (data) {
            set({ user: data, loading: false, hydrated: true });
            await afterUserChange(data);
            return;
          }
          // Rehydrate in-memory mock session from persisted zustand user
          if (import.meta.env.VITE_FORCE_MOCK === '1' && get().user) {
            setMockSessionUser(get().user);
            set({ loading: false, hydrated: true });
            await afterUserChange(get().user);
            return;
          }
          set({ user: null, loading: false, hydrated: true });
          await afterUserChange(null);
        } catch {
          // Network / unexpected errors: do not keep a stale persisted user
          // as "logged in" when the live session cookie is missing.
          set({ user: null, loading: false, hydrated: true });
          await afterUserChange(null);
        }
      },

      login: async (email, password) => {
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
        set({
          user: result.user,
          loading: false,
          error: null,
          totpChallengeId: null,
        });
        await afterUserChange(result.user);
        return {};
      },

      completeTotp: async (code) => {
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
        set({
          user: result.user,
          loading: false,
          error: null,
          totpChallengeId: null,
        });
        await afterUserChange(result.user);
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

      logout: async () => {
        await logoutRequest();
        set({ user: null, error: null, totpChallengeId: null });
        await afterUserChange(null);
      },
    }),
    {
      name: 'tahti-web-auth',
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => {
        state?.refresh();
      },
    },
  ),
);
