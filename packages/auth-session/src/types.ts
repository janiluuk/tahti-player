export type AuthSessionStorage = {
  getRefreshToken(): Promise<string | null> | string | null;
  setRefreshToken(token: string | null): Promise<void> | void;
};

export type AuthSessionConfig = {
  apiBase: string;
  refreshPath?: string;
  logoutPath?: string;
  storage: AuthSessionStorage;
  cookieRefresh?: boolean;
  accessTokenTtlSkewSec?: number;
  fetch?: typeof fetch;
  now?: () => number;
};

export type AuthSessionState =
  | { status: 'signed-out' }
  | {
      status: 'signed-in';
      accessToken: string;
      expiresAt: number;
      userId?: string;
    }
  | { status: 'refreshing' };

export type LoginTokens = {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
  userId?: string;
};

export type RefreshResponse = {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
};
