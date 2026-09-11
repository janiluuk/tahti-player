import type { FetchMeta } from '../client';
import { getJson, mutate } from '../http';
import { failMeta, isForceMock } from '../mode';

// ── News ────────────────────────────────────────────────────────────────────

export type AdminNewsPost = {
  id: string;
  headline: string;
  summary: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  authorName: string;
  publishedAt: string | null;
  createdAt: string;
};

function mockNewsPosts(): AdminNewsPost[] {
  return [
    {
      id: 'news-1',
      headline: 'Fair-rotation radio now covers 9 channels',
      summary:
        'Tahti Radio auto-features any member channel that goes live — no editorial picks.',
      authorName: 'Board',
      publishedAt: '2026-08-10T09:00:00.000Z',
      createdAt: '2026-08-10T08:30:00.000Z',
    },
    {
      id: 'news-2',
      headline: 'AGM date set for October',
      summary: 'Draft agenda circulating to members this week.',
      authorName: 'Board',
      publishedAt: null,
      createdAt: '2026-08-14T10:00:00.000Z',
    },
  ];
}

const MOCK_NEWS_STORAGE_KEY = 'tahti-web-mock-news';

let mockNewsState: AdminNewsPost[] | null = null;

function persistNewsState(posts: AdminNewsPost[]): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(MOCK_NEWS_STORAGE_KEY, JSON.stringify(posts));
  }
}

function storedNewsState(): AdminNewsPost[] | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  const stored = localStorage.getItem(MOCK_NEWS_STORAGE_KEY);
  if (!stored) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as AdminNewsPost[]) : null;
  } catch {
    return null;
  }
}

function newsState(): AdminNewsPost[] {
  if (!mockNewsState) {
    mockNewsState = storedNewsState() ?? mockNewsPosts();
  }
  return mockNewsState;
}

export function listMockPublishedNews(): AdminNewsPost[] {
  return newsState().filter((post) => Boolean(post.publishedAt));
}

export async function fetchAdminNews(): Promise<{
  data: AdminNewsPost[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: newsState(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminNewsPost[] | { posts: AdminNewsPost[] }>(
      '/api/admin/news',
    );
    return {
      data: Array.isArray(data) ? data : data.posts,
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function createNewsPost(input: {
  headline: string;
  summary: string;
  imageUrl?: string;
  linkUrl?: string;
  linkLabel?: string;
  publish: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    const posts = newsState();
    posts.unshift({
      id: `news-${Date.now()}`,
      headline: input.headline,
      summary: input.summary,
      imageUrl: input.imageUrl?.trim() || null,
      linkUrl: input.linkUrl?.trim() || null,
      linkLabel: input.linkLabel?.trim() || null,
      authorName: 'Demo Board',
      publishedAt: input.publish ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
    });
    persistNewsState(posts);
    return { ok: true };
  }
  return mutate('/api/admin/news', 'POST', input);
}

export async function updateNewsPost(
  id: string,
  input: {
    headline?: string;
    summary?: string;
    imageUrl?: string | null;
    linkUrl?: string | null;
    linkLabel?: string | null;
    publish?: boolean;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    const post = newsState().find((p) => p.id === id);
    if (post) {
      if (input.headline != null) {
        post.headline = input.headline;
      }
      if (input.summary != null) {
        post.summary = input.summary;
      }
      if (input.imageUrl !== undefined) {
        post.imageUrl = input.imageUrl?.trim() || null;
      }
      if (input.linkUrl !== undefined) {
        post.linkUrl = input.linkUrl?.trim() || null;
      }
      if (input.linkLabel !== undefined) {
        post.linkLabel = input.linkLabel?.trim() || null;
      }
      if (input.publish != null) {
        post.publishedAt = input.publish ? new Date().toISOString() : null;
      }
      persistNewsState(newsState());
    }
    return { ok: true };
  }
  return mutate(`/api/admin/news/${encodeURIComponent(id)}`, 'PATCH', input);
}

export async function deleteNewsPost(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockNewsState = newsState().filter((p) => p.id !== id);
    persistNewsState(mockNewsState);
    return { ok: true };
  }
  return mutate(`/api/admin/news/${encodeURIComponent(id)}`, 'DELETE');
}
