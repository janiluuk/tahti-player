import { create } from 'zustand';

import type { OAuthErrorCode } from '../api/oauth';

export type AuthModalMode = 'login' | 'join';

type AuthModalState = {
  isOpen: boolean;
  mode: AuthModalMode;
  /** Set when a Google/Facebook sign-in came back with an error. */
  oauthError: OAuthErrorCode | null;
  open: (mode?: AuthModalMode) => void;
  openWithOAuthError: (code: OAuthErrorCode) => void;
  close: () => void;
  setMode: (mode: AuthModalMode) => void;
};

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  mode: 'login',
  oauthError: null,
  open: (mode = 'login') => set({ isOpen: true, mode, oauthError: null }),
  openWithOAuthError: (code) =>
    set({ isOpen: true, mode: 'login', oauthError: code }),
  close: () => set({ isOpen: false, oauthError: null }),
  setMode: (mode) => set({ mode, oauthError: null }),
}));
