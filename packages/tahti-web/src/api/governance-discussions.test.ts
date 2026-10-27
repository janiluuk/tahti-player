import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchDiscussionTopic,
  fetchDiscussionTopics,
  removeDiscussionPost,
  replyToDiscussion,
  setDiscussionMute,
} from './governance-discussions';

function respond(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('governance discussions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('reads the topic list', async () => {
    vi.stubGlobal('fetch', respond({ topics: [{ id: 't1', title: 'Stage' }] }));
    const { data, meta } = await fetchDiscussionTopics();
    expect(meta.source).toBe('api');
    expect(data.map((t) => t.id)).toEqual(['t1']);
  });

  it('posts a trimmed reply', async () => {
    const fetchMock = respond(
      { id: '9', body: 'Yes', author: 'Aino', createdAt: '2026-10-27' },
      201,
    );
    vi.stubGlobal('fetch', fetchMock);
    const result = await replyToDiscussion('t1', '  Yes  ');
    expect(result).toMatchObject({ ok: true, data: { id: '9' } });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain('/api/v1/governance/discussions/t1/posts');
    expect(JSON.parse(init.body)).toEqual({ body: 'Yes' });
  });

  it("passes on the API's reason", async () => {
    vi.stubGlobal(
      'fetch',
      respond({ error: 'This topic is closed to replies' }, 409),
    );
    await expect(replyToDiscussion('t1', 'Late')).resolves.toEqual({
      ok: false,
      error: 'This topic is closed to replies',
    });
  });

  it('a list read failure carries the reason', async () => {
    vi.stubGlobal('fetch', respond({ error: 'Members only' }, 403));
    const { data, meta } = await fetchDiscussionTopics();
    expect(data).toEqual([]);
    expect(meta.reason).toBe('Members only');
  });

  it('replies, mutes and removes in the mock app', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    const posted = await replyToDiscussion(
      'topic-festival-2027',
      'Count me in',
    );
    expect(posted.ok).toBe(true);
    const after = await fetchDiscussionTopic('topic-festival-2027');
    expect(after.data?.following).toBe(true);
    expect(after.data?.posts.at(-1)?.body).toBe('Count me in');

    await setDiscussionMute('topic-festival-2027', true);
    expect(
      (await fetchDiscussionTopic('topic-festival-2027')).data?.muted,
    ).toBe(true);

    const id = after.data!.posts.at(-1)!.id;
    await expect(
      removeDiscussionPost('topic-festival-2027', id),
    ).resolves.toEqual({ ok: true, data: null });
    await expect(
      replyToDiscussion('topic-fees-2026', 'Late'),
    ).resolves.toMatchObject({ ok: false });
  });
});
