import { apiBase } from './http';
import {
  allowMockFallback,
  failMeta,
  isForceMock,
  type FetchMeta,
} from './mode';

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`${path} → ${response.status}`);
  }
  return (await response.json()) as T;
}

export type MentionUser = {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
};

export type PublicMention = {
  id: string;
  surface: string;
  createdAt: string;
  mentioner: { username: string; displayName: string };
  sourceId?: string | null;
  sourceTitle?: string | null;
  sourceUrl?: string | null;
};

export async function searchMentionUsers(query: string): Promise<{
  data: MentionUser[];
  meta: FetchMeta;
}> {
  const normalized = query.trim();
  if (normalized.length < 2) {
    return { data: [], meta: { source: 'api' } };
  }
  if (isForceMock()) {
    const users = [
      { username: 'midnight-cartography', displayName: 'Midnight Cartography' },
      { username: 'northern-signals', displayName: 'Northern Signals' },
      { username: 'yaniho', displayName: 'Yaniho' },
    ].filter((user) => user.username.includes(normalized.toLowerCase()));
    return { data: users, meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const data = await requestJson<MentionUser[]>(
      `/api/me/users/search?q=${encodeURIComponent(normalized)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (error) {
    return {
      data: [],
      meta: allowMockFallback()
        ? failMeta(error)
        : { source: 'api', reason: String(error) },
    };
  }
}

export async function fetchPublicMentions(username: string): Promise<{
  data: PublicMention[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return { data: [], meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const data = await requestJson<PublicMention[]>(
      `/api/v1/u/${encodeURIComponent(username)}/mentions`,
    );
    return { data, meta: { source: 'api' } };
  } catch (error) {
    return {
      data: [],
      meta: allowMockFallback()
        ? failMeta(error)
        : { source: 'api', reason: String(error) },
    };
  }
}
