import { afterEach, describe, expect, it, vi } from 'vitest';

import { createStudioCollection } from './studio-collections';

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
