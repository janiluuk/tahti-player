import type {
  AuthSessionConfig,
  AuthSessionState,
  LoginTokens,
  RefreshResponse,
} from './types';

const CHANNEL_NAME = 'tahti-auth-session';

type BroadcastMessage =
  | {
      type: 'token-updated';
      accessToken: string;
      expiresAt: number;
      userId?: string;
    }
  | { type: 'signed-out' };

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

function isNetworkError(err: unknown): boolean {
  return (
    err instanceof TypeError ||
    (err instanceof Error &&
      /network|fetch|offline|failed to fetch/i.test(err.message))
  );
}

export class AuthSession {
  private readonly config: Required<
    Pick<
      AuthSessionConfig,
      | 'apiBase'
      | 'refreshPath'
      | 'logoutPath'
      | 'storage'
      | 'cookieRefresh'
      | 'accessTokenTtlSkewSec'
      | 'fetch'
      | 'now'
    >
  >;
  private state: AuthSessionState = { status: 'signed-out' };
  private listeners = new Set<(state: AuthSessionState) => void>();
  private refreshPromise: Promise<string | null> | null = null;
  private proactiveTimer: ReturnType<typeof setTimeout> | null = null;
  private channel: BroadcastChannel | null = null;
  private started = false;
  private onFocus: (() => void) | null = null;
  private onOnline: (() => void) | null = null;

  constructor(config: AuthSessionConfig) {
    this.config = {
      apiBase: config.apiBase,
      refreshPath: config.refreshPath ?? '/api/auth/token/refresh',
      logoutPath: config.logoutPath ?? '/api/auth/logout',
      storage: config.storage,
      cookieRefresh: config.cookieRefresh ?? false,
      accessTokenTtlSkewSec: config.accessTokenTtlSkewSec ?? 60,
      fetch: config.fetch ?? fetch.bind(globalThis),
      now: config.now ?? (() => Date.now()),
    };
  }

  getAccessToken(): string | null {
    return this.state.status === 'signed-in' ? this.state.accessToken : null;
  }

  getState(): AuthSessionState {
    return this.state;
  }

  onChange(listener: (state: AuthSessionState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async setFromLogin(params: LoginTokens): Promise<void> {
    if (params.refreshToken) {
      await this.config.storage.setRefreshToken(params.refreshToken);
    }
    this.applySignedIn({
      accessToken: params.accessToken,
      expiresAt: this.config.now() + params.expiresIn * 1000,
      userId: params.userId,
      broadcast: true,
    });
  }

  async signOut(): Promise<void> {
    const accessToken = this.getAccessToken();
    try {
      await this.config.fetch(
        joinUrl(this.config.apiBase, this.config.logoutPath),
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        },
      );
    } catch {
      // best-effort
    }
    await this.clearLocal({ broadcast: true });
  }

  async refresh(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    this.refreshPromise = this.runRefresh().finally(() => {
      this.refreshPromise = null;
    });
    return this.refreshPromise;
  }

  async fetchWithAuth(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const headers = new Headers(init?.headers);
    let token = this.getAccessToken();
    if (!token) {
      token = await this.refresh();
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const response = await this.config.fetch(input, {
      ...init,
      headers,
      credentials: init?.credentials ?? 'include',
    });
    if (response.status !== 401) {
      return response;
    }
    const next = await this.refresh();
    if (!next) {
      return response;
    }
    const retryHeaders = new Headers(init?.headers);
    retryHeaders.set('Authorization', `Bearer ${next}`);
    return this.config.fetch(input, {
      ...init,
      headers: retryHeaders,
      credentials: init?.credentials ?? 'include',
    });
  }

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
        const msg = event.data;
        if (!msg || typeof msg !== 'object') {
          return;
        }
        if (msg.type === 'signed-out') {
          void this.clearLocal({ broadcast: false });
          return;
        }
        if (msg.type === 'token-updated') {
          this.applySignedIn({
            accessToken: msg.accessToken,
            expiresAt: msg.expiresAt,
            userId: msg.userId,
            broadcast: false,
          });
        }
      };
    }
    if (typeof window !== 'undefined') {
      this.onFocus = () => {
        void this.refreshIfDue();
      };
      this.onOnline = () => {
        void this.refreshIfDue();
      };
      window.addEventListener('focus', this.onFocus);
      window.addEventListener('online', this.onOnline);
    }
    this.scheduleProactiveRefresh();
  }

  stop(): void {
    this.started = false;
    if (this.proactiveTimer) {
      clearTimeout(this.proactiveTimer);
      this.proactiveTimer = null;
    }
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (typeof window !== 'undefined') {
      if (this.onFocus) {
        window.removeEventListener('focus', this.onFocus);
      }
      if (this.onOnline) {
        window.removeEventListener('online', this.onOnline);
      }
    }
    this.onFocus = null;
    this.onOnline = null;
  }

  private async runRefresh(): Promise<string | null> {
    const previous = this.state.status === 'signed-in' ? this.state : null;
    this.setState({ status: 'refreshing' });
    try {
      const refreshToken = this.config.cookieRefresh
        ? null
        : await this.config.storage.getRefreshToken();
      if (!this.config.cookieRefresh && !refreshToken) {
        await this.clearLocal({ broadcast: true });
        return null;
      }
      const response = await this.config.fetch(
        joinUrl(this.config.apiBase, this.config.refreshPath),
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: this.config.cookieRefresh
            ? JSON.stringify({})
            : JSON.stringify({ refreshToken }),
        },
      );
      if (response.status === 401 || response.status === 403) {
        await this.clearLocal({ broadcast: true });
        return null;
      }
      if (!response.ok) {
        if (previous) {
          this.applySignedIn({ ...previous, broadcast: false });
        } else {
          this.setState({ status: 'signed-out' });
        }
        return null;
      }
      const data = (await response.json()) as RefreshResponse;
      if (data.refreshToken) {
        await this.config.storage.setRefreshToken(data.refreshToken);
      }
      this.applySignedIn({
        accessToken: data.accessToken,
        expiresAt: this.config.now() + data.expiresIn * 1000,
        userId: previous?.userId,
        broadcast: true,
      });
      return data.accessToken;
    } catch (err) {
      if (isNetworkError(err)) {
        if (previous) {
          this.applySignedIn({ ...previous, broadcast: false });
        } else {
          this.setState({ status: 'signed-out' });
        }
        return null;
      }
      await this.clearLocal({ broadcast: true });
      return null;
    }
  }

  private async refreshIfDue(): Promise<void> {
    if (this.state.status !== 'signed-in') {
      return;
    }
    const dueAt =
      this.state.expiresAt - this.config.accessTokenTtlSkewSec * 1000;
    if (this.config.now() >= dueAt) {
      await this.refresh();
    }
  }

  private applySignedIn(input: {
    accessToken: string;
    expiresAt: number;
    userId?: string;
    broadcast: boolean;
  }): void {
    this.setState({
      status: 'signed-in',
      accessToken: input.accessToken,
      expiresAt: input.expiresAt,
      userId: input.userId,
    });
    this.scheduleProactiveRefresh();
    if (input.broadcast) {
      this.post({
        type: 'token-updated',
        accessToken: input.accessToken,
        expiresAt: input.expiresAt,
        userId: input.userId,
      });
    }
  }

  private async clearLocal(opts: { broadcast: boolean }): Promise<void> {
    await this.config.storage.setRefreshToken(null);
    if (this.proactiveTimer) {
      clearTimeout(this.proactiveTimer);
      this.proactiveTimer = null;
    }
    this.setState({ status: 'signed-out' });
    if (opts.broadcast) {
      this.post({ type: 'signed-out' });
    }
  }

  private scheduleProactiveRefresh(): void {
    if (this.proactiveTimer) {
      clearTimeout(this.proactiveTimer);
      this.proactiveTimer = null;
    }
    if (this.state.status !== 'signed-in') {
      return;
    }
    const delay =
      this.state.expiresAt -
      this.config.now() -
      this.config.accessTokenTtlSkewSec * 1000;
    const ms = Math.max(0, delay);
    this.proactiveTimer = setTimeout(() => {
      void this.refresh();
    }, ms);
  }

  private setState(next: AuthSessionState): void {
    this.state = next;
    for (const listener of this.listeners) {
      listener(next);
    }
  }

  private post(message: BroadcastMessage): void {
    try {
      this.channel?.postMessage(message);
    } catch {
      // ignore
    }
  }
}
