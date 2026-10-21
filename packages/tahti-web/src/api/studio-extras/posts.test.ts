import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createArtistPost,
  fetchNewsletterSubscriberStats,
  isScheduledPost,
  updateArtistPost,
} from './posts';

describe('fetchNewsletterSubscriberStats', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the subscriber counts', async () => {
    const stats = {
      total: 3,
      confirmed: 2,
      newLast30Days: 1,
      fanSubscriberCount: 0,
    };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(stats), { status: 200 }));
    await expect(fetchNewsletterSubscriberStats()).resolves.toMatchObject({
      data: stats,
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/newsletter/subscribers',
    );
  });

  it('returns no stats when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 500 }),
    );
    await expect(fetchNewsletterSubscriberStats()).resolves.toMatchObject({
      data: null,
    });
  });
});

const postRow = {
  id: 'post-1',
  title: 'Tour',
  body: 'Dates are up',
  linkUrl: 'https://example.com/tour',
  linkLabel: 'Tickets',
  images: [],
  publishAt: '2030-01-01T18:00:00.000Z',
  createdAt: '2026-10-01T10:00:00.000Z',
};

describe('createArtistPost', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the link label and publish time', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify(postRow), { status: 201 }),
      );
    const input = {
      title: 'Tour',
      body: 'Dates are up',
      linkUrl: 'https://example.com/tour',
      linkLabel: 'Tickets',
      publishAt: '2030-01-01T18:00:00.000Z',
    };
    await expect(createArtistPost(input)).resolves.toMatchObject({
      ok: true,
      data: { id: 'post-1' },
    });
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/tahti-api/api/me/posts');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual(input);
  });
});

describe('updateArtistPost', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('PATCHes only the fields it is given', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify(postRow), { status: 200 }),
      );
    await expect(
      updateArtistPost('post-1', { body: 'Dates are up', linkLabel: null }),
    ).resolves.toMatchObject({ ok: true, data: { linkLabel: 'Tickets' } });
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/tahti-api/api/me/posts/post-1');
    expect(init?.method).toBe('PATCH');
    expect(JSON.parse(String(init?.body))).toEqual({
      body: 'Dates are up',
      linkLabel: null,
    });
  });

  it('reports a failed save', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
      }),
    );
    await expect(updateArtistPost('missing', { body: 'x' })).resolves.toEqual(
      expect.objectContaining({ ok: false }),
    );
  });
});

describe('isScheduledPost', () => {
  it('is true only for a publish time still ahead', () => {
    const now = Date.parse('2026-10-03T12:00:00.000Z');
    expect(
      isScheduledPost({ publishAt: '2026-10-04T12:00:00.000Z' }, now),
    ).toBe(true);
    expect(
      isScheduledPost({ publishAt: '2026-10-02T12:00:00.000Z' }, now),
    ).toBe(false);
    expect(isScheduledPost({ publishAt: 'garbage' }, now)).toBe(false);
  });
});
