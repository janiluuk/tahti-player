import { requestJson } from './client-request';
import { apiErrorMeta, isForceMock, type FetchMeta } from './mode';

export type DiscussionTopicStatus = 'OPEN' | 'CLOSED';

export type DiscussionTopic = {
  id: string;
  title: string;
  body: string;
  status: DiscussionTopicStatus;
  pinned: boolean;
  createdBy: string;
  postCount: number;
  lastPostAt: string;
  createdAt: string;
  following: boolean;
  muted: boolean;
};

export type DiscussionPost = {
  id: string;
  body: string;
  author: string;
  createdAt: string;
  mine?: boolean;
};

export type DiscussionTopicDetail = DiscussionTopic & {
  posts: DiscussionPost[];
};

export type DiscussionParticipation = { following: boolean; muted: boolean };

export type DiscussionResult<T> =
  { ok: true; data: T } | { ok: false; error: string };

const MOCK_SELF = 'Demo Member';
const HOUR = 60 * 60 * 1000;

let mockTopics: DiscussionTopicDetail[] = [
  {
    id: 'topic-festival-2027',
    title: 'A Tahti stage at a summer festival in 2027?',
    body: 'We have been offered a small stage for one evening. Who would play, and what should the evening sound like?',
    status: 'OPEN',
    pinned: true,
    createdBy: 'Mart Saar',
    postCount: 2,
    lastPostAt: new Date(Date.now() - 3 * HOUR).toISOString(),
    createdAt: new Date(Date.now() - 48 * HOUR).toISOString(),
    following: false,
    muted: false,
    posts: [
      {
        id: '1',
        body: 'I would love to play a late ambient set.',
        author: 'Liis Kask',
        createdAt: new Date(Date.now() - 20 * HOUR).toISOString(),
      },
      {
        id: '2',
        body: 'Could we stream it on Tahti Radio too?',
        author: 'Aino Virtanen',
        createdAt: new Date(Date.now() - 3 * HOUR).toISOString(),
      },
    ],
  },
  {
    id: 'topic-fees-2026',
    title: 'Membership fee for 2026',
    body: 'The fee stays at 20 € this year. Thanks for the comments.',
    status: 'CLOSED',
    pinned: false,
    createdBy: 'Mart Saar',
    postCount: 0,
    lastPostAt: '2026-01-20T10:00:00.000Z',
    createdAt: '2026-01-20T10:00:00.000Z',
    following: false,
    muted: false,
    posts: [],
  },
];

function summary(topic: DiscussionTopicDetail): DiscussionTopic {
  return {
    id: topic.id,
    title: topic.title,
    body: topic.body,
    status: topic.status,
    pinned: topic.pinned,
    createdBy: topic.createdBy,
    postCount: topic.postCount,
    lastPostAt: topic.lastPostAt,
    createdAt: topic.createdAt,
    following: topic.following,
    muted: topic.muted,
  };
}

function updateMockTopic(
  id: string,
  update: (topic: DiscussionTopicDetail) => DiscussionTopicDetail,
): DiscussionTopicDetail | undefined {
  mockTopics = mockTopics.map((t) => (t.id === id ? update(t) : t));
  return mockTopics.find((t) => t.id === id);
}

function sortTopics(topics: DiscussionTopic[]): DiscussionTopic[] {
  return [...topics].sort(
    (a, b) =>
      Number(b.pinned) - Number(a.pinned) ||
      b.lastPostAt.localeCompare(a.lastPostAt),
  );
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function topicPath(id: string): string {
  return `/api/v1/governance/discussions/${encodeURIComponent(id)}`;
}

export async function fetchDiscussionTopics(): Promise<{
  data: DiscussionTopic[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: sortTopics(mockTopics.map(summary)),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ topics: DiscussionTopic[] }>(
      '/api/v1/governance/discussions',
    );
    return { data: data.topics, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function fetchDiscussionTopic(id: string): Promise<{
  data: DiscussionTopicDetail | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockTopics.find((t) => t.id === id) ?? null,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<DiscussionTopicDetail>(topicPath(id));
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: apiErrorMeta(err) };
  }
}

export async function replyToDiscussion(
  id: string,
  body: string,
): Promise<DiscussionResult<DiscussionPost>> {
  const trimmed = body.trim();
  if (isForceMock()) {
    const topic = mockTopics.find((t) => t.id === id);
    if (!topic) {
      return { ok: false, error: 'Topic not found' };
    }
    if (topic.status === 'CLOSED') {
      return { ok: false, error: 'This topic is closed to replies' };
    }
    const post: DiscussionPost = {
      id: String(Date.now()),
      body: trimmed,
      author: MOCK_SELF,
      createdAt: new Date().toISOString(),
      mine: true,
    };
    updateMockTopic(id, (t) => ({
      ...t,
      posts: [...t.posts, post],
      postCount: t.postCount + 1,
      lastPostAt: post.createdAt,
      following: true,
    }));
    return { ok: true, data: post };
  }
  try {
    const { data } = await requestJson<DiscussionPost>(
      `/api/v1/governance/discussions/${encodeURIComponent(id)}/posts`,
      { method: 'POST', body: JSON.stringify({ body: trimmed }) },
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Could not post your reply') };
  }
}

export async function setDiscussionFollow(
  id: string,
  following: boolean,
): Promise<DiscussionResult<DiscussionParticipation>> {
  if (isForceMock()) {
    const topic = updateMockTopic(id, (t) => ({
      ...t,
      following,
      muted: following ? t.muted : false,
    }));
    return topic
      ? { ok: true, data: { following: topic.following, muted: topic.muted } }
      : { ok: false, error: 'Topic not found' };
  }
  try {
    const { data } = await requestJson<DiscussionParticipation>(
      `/api/v1/governance/discussions/${encodeURIComponent(id)}/follow`,
      { method: 'PUT', body: JSON.stringify({ following }) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: errorMessage(err, 'Could not update the topic'),
    };
  }
}

export async function setDiscussionMute(
  id: string,
  muted: boolean,
): Promise<DiscussionResult<DiscussionParticipation>> {
  if (isForceMock()) {
    const topic = updateMockTopic(id, (t) => ({
      ...t,
      following: true,
      muted,
    }));
    return topic
      ? { ok: true, data: { following: true, muted } }
      : { ok: false, error: 'Topic not found' };
  }
  try {
    const { data } = await requestJson<DiscussionParticipation>(
      `/api/v1/governance/discussions/${encodeURIComponent(id)}/mute`,
      { method: 'PUT', body: JSON.stringify({ muted }) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: errorMessage(err, 'Could not update the topic'),
    };
  }
}

export async function removeDiscussionPost(
  id: string,
  postId: string,
): Promise<DiscussionResult<null>> {
  if (isForceMock()) {
    const topic = mockTopics.find((t) => t.id === id);
    if (!topic?.posts.some((p) => p.id === postId)) {
      return { ok: false, error: 'Post not found' };
    }
    updateMockTopic(id, (t) => ({
      ...t,
      posts: t.posts.filter((p) => p.id !== postId),
      postCount: t.postCount - 1,
    }));
    return { ok: true, data: null };
  }
  try {
    await requestJson(
      `/api/v1/governance/discussions/${encodeURIComponent(id)}/posts/${encodeURIComponent(postId)}`,
      { method: 'DELETE' },
    );
    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: errorMessage(err, 'Could not remove the reply'),
    };
  }
}

export type CreateDiscussionTopicInput = {
  title: string;
  body: string;
  pinned?: boolean;
};

export type UpdateDiscussionTopicInput = Partial<CreateDiscussionTopicInput> & {
  status?: DiscussionTopicStatus;
};

export async function createDiscussionTopic(
  input: CreateDiscussionTopicInput,
): Promise<DiscussionResult<DiscussionTopic>> {
  if (isForceMock()) {
    const now = new Date().toISOString();
    const topic: DiscussionTopicDetail = {
      id: `topic-${Date.now()}`,
      title: input.title.trim(),
      body: input.body.trim(),
      status: 'OPEN',
      pinned: input.pinned ?? false,
      createdBy: MOCK_SELF,
      postCount: 0,
      lastPostAt: now,
      createdAt: now,
      following: true,
      muted: false,
      posts: [],
    };
    mockTopics = [topic, ...mockTopics];
    return { ok: true, data: summary(topic) };
  }
  try {
    const { data } = await requestJson<DiscussionTopic>(
      '/api/admin/discussions',
      { method: 'POST', body: JSON.stringify(input) },
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Could not open the topic') };
  }
}

export async function updateDiscussionTopic(
  id: string,
  input: UpdateDiscussionTopicInput,
): Promise<DiscussionResult<DiscussionTopic>> {
  if (isForceMock()) {
    const topic = updateMockTopic(id, (t) => ({ ...t, ...input }));
    return topic
      ? { ok: true, data: summary(topic) }
      : { ok: false, error: 'Topic not found' };
  }
  try {
    const { data } = await requestJson<DiscussionTopic>(
      `/api/admin/discussions/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(input) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: errorMessage(err, 'Could not update the topic'),
    };
  }
}
