import type { FetchMeta } from './client';
import { allowMockFallback, apiErrorMeta, failMeta, isForceMock } from './mode';

const apiBase = () => {
  if (import.meta.env.VITE_TAHTI_API_URL?.startsWith('http')) {
    return import.meta.env.VITE_TAHTI_API_URL.replace(/\/$/, '');
  }
  return '/tahti-api';
};

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; status: number }> {
  const { headers: initHeaders, ...rest } = init ?? {};
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...initHeaders,
    },
  });
  if (!res.ok) {
    let detail = `${path} → ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body.error || body.message) {
        detail = body.error ?? body.message ?? detail;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  if (res.status === 204) {
    return { data: undefined as T, status: res.status };
  }
  return { data: (await res.json()) as T, status: res.status };
}

export type ConversationSummary = {
  id: string;
  otherUser: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  lastMessage: {
    body: string;
    senderUsername: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
};

export type ChatDm = {
  id: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatarUrl: string | null;
  body: string;
  createdAt: string;
  isMine: boolean;
};

export type ConversationDetail = {
  id: string;
  otherUser: ConversationSummary['otherUser'];
  messages: ChatDm[];
};

let mockConversations: ConversationSummary[] = [
  {
    id: 'conv-mock-1',
    otherUser: {
      username: 'listener',
      displayName: 'Listener One',
      avatarUrl: null,
    },
    lastMessage: {
      body: 'Loved the set last night!',
      senderUsername: 'listener',
      createdAt: new Date().toISOString(),
    },
    unreadCount: 1,
    updatedAt: new Date().toISOString(),
  },
];

const mockThreads = new Map<string, ChatDm[]>([
  [
    'conv-mock-1',
    [
      {
        id: 'm1',
        senderUsername: 'listener',
        senderDisplayName: 'Listener One',
        senderAvatarUrl: null,
        body: 'Loved the set last night!',
        createdAt: new Date(Date.now() - 3600_000).toISOString(),
        isMine: false,
      },
      {
        id: 'm2',
        senderUsername: 'demo',
        senderDisplayName: 'Demo Artist',
        senderAvatarUrl: null,
        body: 'Thanks — more soon.',
        createdAt: new Date(Date.now() - 1800_000).toISOString(),
        isMine: true,
      },
    ],
  ],
]);

export async function fetchConversations(): Promise<{
  data: ConversationSummary[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [...mockConversations],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ConversationSummary[]>(
      '/api/me/messages/conversations',
    );
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: [...mockConversations], meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

function mockConversationDetail(id: string): ConversationDetail | null {
  const summary = mockConversations.find((c) => c.id === id);
  if (!summary) {
    return null;
  }
  return {
    id,
    otherUser: summary.otherUser,
    messages: [...(mockThreads.get(id) ?? [])],
  };
}

export async function fetchConversation(
  id: string,
): Promise<{ data: ConversationDetail | null; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockConversationDetail(id),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ConversationDetail>(
      `/api/me/messages/conversations/${encodeURIComponent(id)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockConversationDetail(id), meta: failMeta(err) };
    }
    return { data: null, meta: apiErrorMeta(err) };
  }
}

export async function sendDm(
  conversationId: string,
  body: string,
): Promise<{ ok: true; data: ChatDm } | { ok: false; error: string }> {
  if (isForceMock()) {
    const msg: ChatDm = {
      id: `m-${Date.now()}`,
      senderUsername: 'demo',
      senderDisplayName: 'Demo Artist',
      senderAvatarUrl: null,
      body,
      createdAt: new Date().toISOString(),
      isMine: true,
    };
    const list = mockThreads.get(conversationId) ?? [];
    list.push(msg);
    mockThreads.set(conversationId, list);
    mockConversations = mockConversations.map((c) =>
      c.id === conversationId
        ? {
            ...c,
            lastMessage: {
              body,
              senderUsername: 'demo',
              createdAt: msg.createdAt,
            },
            unreadCount: 0,
            updatedAt: msg.createdAt,
          }
        : c,
    );
    return { ok: true, data: msg };
  }
  try {
    const { data } = await requestJson<ChatDm>(
      `/api/me/messages/conversations/${encodeURIComponent(conversationId)}/messages`,
      { method: 'POST', body: JSON.stringify({ body }) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Send failed',
    };
  }
}

export async function startConversation(
  username: string,
): Promise<
  { ok: true; conversationId: string } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const existing = mockConversations.find(
      (c) => c.otherUser.username === username,
    );
    if (existing) {
      return { ok: true, conversationId: existing.id };
    }
    const id = `conv-mock-${Date.now()}`;
    mockConversations = [
      {
        id,
        otherUser: { username, displayName: username, avatarUrl: null },
        lastMessage: null,
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
      },
      ...mockConversations,
    ];
    mockThreads.set(id, []);
    return { ok: true, conversationId: id };
  }
  try {
    const { data } = await requestJson<{ conversationId: string }>(
      '/api/me/messages/conversations',
      { method: 'POST', body: JSON.stringify({ username }) },
    );
    return { ok: true, conversationId: data.conversationId };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Start failed',
    };
  }
}

export async function searchUsers(q: string): Promise<{
  data: Array<{
    username: string;
    displayName: string;
    avatarUrl: string | null;
  }>;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: q
        ? [
            {
              username: 'listener',
              displayName: 'Listener One',
              avatarUrl: null,
            },
          ]
        : [],
      meta: { source: 'mock' },
    };
  }
  try {
    const { data } = await requestJson<
      Array<{ username: string; displayName: string; avatarUrl: string | null }>
    >(`/api/users/search?q=${encodeURIComponent(q)}`);
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return {
        data: q
          ? [
              {
                username: 'listener',
                displayName: 'Listener One',
                avatarUrl: null,
              },
            ]
          : [],
        meta: failMeta(err),
      };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}
