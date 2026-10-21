import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createStudioCollection,
  fetchStudioCollection,
  fetchStudioCollections,
} from './studio-collections';

const json = (body: unknown, status = 201) =>
  new Response(JSON.stringify(body), { status });

const created = {
  id: 'c1',
  slug: 'demo-late-night',
  name: 'Late night',
  visibility: 'DRAFT',
  isPublic: false,
  items: [],
};

describe('createStudioCollection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends Private as the API draft visibility and reads it back as Private', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(created));
    const result = await createStudioCollection({
      name: 'Late night',
      visibility: 'PRIVATE',
      genres: ['house'],
    });
    const body = JSON.parse(String(spy.mock.calls[0]?.[1]?.body));
    expect(body).toMatchObject({
      visibility: 'DRAFT',
      isPublic: false,
      genres: ['house'],
    });
    expect(result.ok && result.data.visibility).toBe('PRIVATE');
  });

  it('keeps an unlisted collection off the public profile', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(json({ ...created, visibility: 'UNLISTED' }));
    await createStudioCollection({
      name: 'Late night',
      visibility: 'UNLISTED',
    });
    expect(JSON.parse(String(spy.mock.calls[0]?.[1]?.body))).toMatchObject({
      visibility: 'UNLISTED',
      isPublic: false,
    });
  });

  it('defaults to public', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(json({ ...created, visibility: 'PUBLIC' }));
    await createStudioCollection({ name: 'Late night' });
    expect(JSON.parse(String(spy.mock.calls[0]?.[1]?.body))).toMatchObject({
      visibility: 'PUBLIC',
      isPublic: true,
    });
  });
});

describe('fetchStudioCollection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("hands each item's gated playback link to its sound", async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json(
        {
          ...created,
          visibility: 'PUBLIC',
          items: [
            {
              id: 'i1',
              position: 1,
              audioUrl: 'https://cdn.example.com/signed.mp3',
              sound: {
                id: 's1',
                title: 'Borrowed',
                artist: { username: 'selector', displayName: 'Selector' },
              },
            },
          ],
        },
        200,
      ),
    );
    const { data } = await fetchStudioCollection('demo-late-night');
    expect(data.items?.[0]?.sound).toMatchObject({
      audioUrl: 'https://cdn.example.com/signed.mp3',
      artist: { displayName: 'Selector' },
    });
  });
});

describe('createStudioCollection under mock', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('derives a slug from the name that fetchStudioCollection resolves', async () => {
    const result = await createStudioCollection({
      name: 'Night Drive!',
      style: 'ALBUM',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.data.slug).toBe('night-drive');

    const { data, meta } = await fetchStudioCollection(result.data.slug);
    expect(meta.source).toBe('mock');
    expect(data.slug).toBe('night-drive');
    expect(data.id).toBe(result.data.id);
  });

  it('lists the new collection first', async () => {
    const result = await createStudioCollection({ name: 'Warmup Mix' });
    expect(result.ok && result.data.slug).toBe('warmup-mix');

    const { data } = await fetchStudioCollections();
    expect(data[0]?.slug).toBe('warmup-mix');
  });

  it('falls back to a generated slug when the name has no letters or digits', async () => {
    const result = await createStudioCollection({ name: '!!!' });
    expect(result.ok && result.data.slug).toMatch(/^mix-\d+$/);
  });
});
