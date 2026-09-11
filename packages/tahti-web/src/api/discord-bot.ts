import { apiBase } from './http';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
  type FetchMeta,
} from './mode';

export type DiscordBotSettings = {
  clientId: string;
  tokenConfigured: boolean;
  tokenHint: string | null;
  source: 'database' | 'env' | 'none';
};

function mockSettings(): DiscordBotSettings {
  return {
    clientId: '1168742859038531594',
    tokenConfigured: true,
    tokenHint: '••••f4eb',
    source: 'database',
  };
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`${path} → ${res.status}`);
  }
  return (await res.json()) as T;
}

async function sendJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = `${path} → ${res.status}`;
    try {
      const errBody = (await res.json()) as { error?: string };
      if (errBody.error) {
        detail = errBody.error;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return (await res.json()) as T;
}

export async function fetchDiscordBotSettings(): Promise<{
  data: DiscordBotSettings;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockSettings(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<DiscordBotSettings>('/api/admin/discord-bot');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockSettings(), meta: failMeta(err) };
    }
    return {
      data: {
        clientId: '',
        tokenConfigured: false,
        tokenHint: null,
        source: 'none',
      },
      meta: apiErrorMeta(err),
    };
  }
}

export async function saveDiscordBotSettings(input: {
  clientId: string;
  token?: string;
}): Promise<
  { ok: true; data: DiscordBotSettings } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return {
      ok: true,
      data: {
        clientId: input.clientId,
        tokenConfigured: true,
        tokenHint: input.token ? `••••${input.token.slice(-4)}` : '••••f4eb',
        source: 'database',
      },
    };
  }
  try {
    const data = await sendJson<DiscordBotSettings>(
      '/api/admin/discord-bot',
      input,
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : 'Failed to save Discord bot settings',
    };
  }
}
