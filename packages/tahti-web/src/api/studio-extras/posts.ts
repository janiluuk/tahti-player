import type { FetchMeta } from '.././client';
import { failMeta, isForceMock } from '.././mode';
import { requestJson } from '.././request-json';

export type ArtistPost = {
  id: string;
  title: string | null;
  body: string;
  linkUrl: string | null;
  linkLabel: string | null;
  images: string[];
  publishAt: string;
  createdAt: string;
};

export type NewsletterDraft = {
  id: string;
  subject: string;
  bodyMd?: string;
  state?: string;
  subscribersOnly?: boolean;
  createdAt?: string;
  sentAt?: string | null;
};

export let mockPosts: ArtistPost[] = [
  {
    id: 'post-mock-1',
    title: 'New set up',
    body: 'Archive just dropped — listen on the channel.',
    linkUrl: null,
    linkLabel: null,
    images: [],
    publishAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

export let mockDrafts: NewsletterDraft[] = [
  {
    id: 'nl-mock-1',
    subject: 'This week on the channel',
    bodyMd: 'Thanks for tuning in.',
    state: 'DRAFT',
    subscribersOnly: false,
    createdAt: new Date().toISOString(),
    sentAt: null,
  },
];

export async function fetchArtistPosts(): Promise<{
  data: ArtistPost[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockPosts.map((post) => ({ ...post, images: [...post.images] })),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ArtistPost[]>('/api/me/posts');
    return {
      data: Array.isArray(data)
        ? data.map((post) => ({ ...post, images: post.images ?? [] }))
        : [],
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function fetchChannelPosts(slug: string): Promise<{
  data: ArtistPost[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockPosts.map((post) => ({ ...post, images: [...post.images] })),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ArtistPost[]>(
      `/api/channels/${encodeURIComponent(slug)}/posts`,
    );
    return {
      data: Array.isArray(data)
        ? data.map((post) => ({ ...post, images: post.images ?? [] }))
        : [],
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function createArtistPost(input: {
  title?: string;
  body: string;
  linkUrl?: string;
}): Promise<{ ok: true; data: ArtistPost } | { ok: false; error: string }> {
  if (isForceMock()) {
    const row: ArtistPost = {
      id: `post-mock-${Date.now()}`,
      title: input.title ?? null,
      body: input.body,
      linkUrl: input.linkUrl ?? null,
      linkLabel: null,
      images: [],
      publishAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    mockPosts = [row, ...mockPosts];
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<ArtistPost>('/api/me/posts', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return { ok: true, data: { ...data, images: data.images ?? [] } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Create failed',
    };
  }
}

export async function uploadArtistPostImage(
  postId: string,
  file: File,
): Promise<{ ok: true; data: ArtistPost } | { ok: false; error: string }> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { ok: false, error: 'Choose a JPEG, PNG, or WebP image.' };
  }
  if (isForceMock()) {
    const imageUrl = URL.createObjectURL(file);
    const current = mockPosts.find((post) => post.id === postId);
    if (!current) {
      return { ok: false, error: 'Post not found.' };
    }
    const data = { ...current, images: [...current.images, imageUrl] };
    mockPosts = mockPosts.map((post) => (post.id === postId ? data : post));
    return { ok: true, data };
  }
  try {
    const prepared = await requestJson<{
      uploadKey: string;
      uploadUrl: string;
    }>(`/api/me/posts/${encodeURIComponent(postId)}/images/prepare`, {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });
    const upload = await fetch(prepared.data.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!upload.ok) {
      throw new Error(`Image upload failed (${upload.status})`);
    }
    const { data } = await requestJson<ArtistPost>(
      `/api/me/posts/${encodeURIComponent(postId)}/images/complete`,
      {
        method: 'POST',
        body: JSON.stringify({ uploadKey: prepared.data.uploadKey }),
      },
    );
    return { ok: true, data: { ...data, images: data.images ?? [] } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Image upload failed',
    };
  }
}

export async function deleteArtistPost(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockPosts = mockPosts.filter((p) => p.id !== id);
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/posts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Delete failed',
    };
  }
}

export async function fetchNewsletterDrafts(): Promise<{
  data: NewsletterDraft[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [...mockDrafts],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<
      | NewsletterDraft[]
      | { drafts: NewsletterDraft[]; page?: number; total?: number }
    >('/api/me/newsletter/drafts?page=1&limit=50');
    const list = Array.isArray(data) ? data : (data.drafts ?? []);
    return { data: list, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function sendNewsletterDraft(
  draftId: string,
  audience?: 'all' | 'fans',
): Promise<{ ok: true; queued?: number } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockDrafts = mockDrafts.map((d) =>
      d.id === draftId
        ? { ...d, state: 'SENT', sentAt: new Date().toISOString() }
        : d,
    );
    return { ok: true, queued: 3 };
  }
  try {
    const { data } = await requestJson<{ queued?: number; ok?: boolean }>(
      `/api/me/newsletter/send/${encodeURIComponent(draftId)}`,
      { method: 'POST', body: JSON.stringify({ audience }) },
    );
    return { ok: true, queued: data.queued };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Send failed',
    };
  }
}

export async function createNewsletterDraft(input: {
  subject: string;
  bodyMd: string;
  subscribersOnly?: boolean;
}): Promise<
  { ok: true; data: NewsletterDraft } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const row: NewsletterDraft = {
      id: `nl-mock-${Date.now()}`,
      subject: input.subject,
      bodyMd: input.bodyMd,
      state: 'DRAFT',
      subscribersOnly: input.subscribersOnly ?? false,
      createdAt: new Date().toISOString(),
      sentAt: null,
    };
    mockDrafts = [row, ...mockDrafts];
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<NewsletterDraft>(
      '/api/me/newsletter/drafts',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Create failed',
    };
  }
}

/** Fire-and-forget emoji reaction (no auth required on Tahti). */
export async function postChatReaction(
  slug: string,
  emoji: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await requestJson(`/api/chat/${encodeURIComponent(slug)}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'React failed',
    };
  }
}
