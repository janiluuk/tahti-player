import type { FetchMeta } from './client';
import { mockFixture } from './mock-overrides';
import { allowMockFallback, apiErrorMeta, failMeta, isForceMock } from './mode';
import { requestJson, RequestJsonError } from './request-json';

export type ChannelStaffRole = 'owner' | 'moderator';

export const RECIPIENT_UNAVAILABLE_MESSAGE =
  'This account is no longer available';

function isRecipientUnavailable(err: unknown): boolean {
  return (
    err instanceof RequestJsonError &&
    err.status === 403 &&
    err.code === 'recipient_unavailable'
  );
}

/** Failure shape for send/start: `recipientUnavailable` is set when the other
 * account was deleted or suspended. */
export type DmFailure = {
  ok: false;
  error: string;
  recipientUnavailable?: true;
};

function dmFailure(err: unknown, fallback: string): DmFailure {
  if (isRecipientUnavailable(err)) {
    return {
      ok: false,
      error: RECIPIENT_UNAVAILABLE_MESSAGE,
      recipientUnavailable: true,
    };
  }
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

export type ConversationSummary = {
  id: string;
  otherUser: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
    channelRole?: ChannelStaffRole | null;
    /** False once the account is deleted or suspended; missing on older APIs. */
    available?: boolean;
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
  senderChannelRole?: ChannelStaffRole | null;
};

export type ConversationDetail = {
  id: string;
  otherUser: ConversationSummary['otherUser'];
  /** Oldest first. */
  messages: ChatDm[];
  /** Older messages exist before `messages[0]`; missing on older APIs. */
  hasMore?: boolean;
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

/** Mock-mode conversation ids treated as read (unreadCount 0), e.g. seeded by
 * the screenshot capture scripts so no unread badges appear. */
const MOCK_READ_KEY = 'tahti-web-mock-messages-read';

function mockConversationsWithReadState(): ConversationSummary[] {
  let read: Set<string>;
  try {
    const parsed = JSON.parse(
      localStorage.getItem(MOCK_READ_KEY) ?? '[]',
    ) as unknown;
    read = new Set(
      Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === 'string')
        : [],
    );
  } catch {
    read = new Set();
  }
  return mockConversations.map((c) =>
    read.has(c.id) ? { ...c, unreadCount: 0 } : c,
  );
}

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
      data: mockFixture('conversations', mockConversationsWithReadState()),
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
      return {
        data: mockFixture('conversations', [...mockConversations]),
        meta: failMeta(err),
      };
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

/** The page of messages before `beforeId`, oldest first. Null when the
 * request fails, so callers can keep what they already show. */
export async function fetchOlderMessages(
  conversationId: string,
  beforeId: string,
): Promise<{ messages: ChatDm[]; hasMore: boolean } | null> {
  if (isForceMock()) {
    return { messages: [], hasMore: false };
  }
  try {
    const { data } = await requestJson<ConversationDetail>(
      `/api/me/messages/conversations/${encodeURIComponent(conversationId)}?before=${encodeURIComponent(beforeId)}`,
    );
    return {
      messages: Array.isArray(data.messages) ? data.messages : [],
      hasMore: data.hasMore === true,
    };
  } catch {
    return null;
  }
}

export async function sendDm(
  conversationId: string,
  body: string,
): Promise<{ ok: true; data: ChatDm } | DmFailure> {
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
    return dmFailure(err, 'Send failed');
  }
}

export async function startConversation(
  username: string,
): Promise<{ ok: true; conversationId: string } | DmFailure> {
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
    return dmFailure(err, 'Start failed');
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
