import { afterEach, describe, expect, it, vi } from 'vitest';

import { TEST_CONFIG } from '../test-helpers';
import {
  collectionCreateBody,
  parseCollectionVisibility,
  runCollectionsCreate,
} from './collections-create.mjs';

function mockResponses(
  ...responses: Array<{ status: number; body?: unknown }>
) {
  const fetchMock = vi.fn();
  for (const { status, body } of responses) {
    fetchMock.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body ?? null,
    });
  }
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const sent = (fetchMock: ReturnType<typeof vi.fn>, index: number) => {
  const [url, init] = fetchMock.mock.calls[index];
  return { url, method: init?.method, body: JSON.parse(init?.body ?? 'null') };
};

describe('runCollectionsCreate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a private mix series and sets the cover from a URL', async () => {
    const fetchMock = mockResponses(
      {
        status: 201,
        body: {
          slug: 'nightriders',
          name: 'Nightriders',
          type: 'MIX_SERIES',
          visibility: 'DRAFT',
          isPublic: false,
        },
      },
      { status: 200, body: { url: 'https://cdn.test/c.jpg' } },
    );

    const result = await runCollectionsCreate(TEST_CONFIG, ' Nightriders ', {
      slug: 'nightriders',
      type: 'mix-series',
      description: 'Monthly trance',
      private: true,
      coverUrl: 'https://img.hearthis.at/a.jpg',
    });

    expect(sent(fetchMock, 0)).toEqual({
      url: `${TEST_CONFIG.apiUrl}/api/me/collections`,
      method: 'POST',
      body: {
        name: 'Nightriders',
        slug: 'nightriders',
        type: 'MIX_SERIES',
        description: 'Monthly trance',
        visibility: 'DRAFT',
      },
    });
    expect(sent(fetchMock, 1)).toEqual({
      url: `${TEST_CONFIG.apiUrl}/api/me/collections/nightriders/cover/from-url`,
      method: 'POST',
      body: { sourceUrl: 'https://img.hearthis.at/a.jpg' },
    });
    expect(result).toEqual({
      output: expect.stringContaining('Created collection "Nightriders".'),
      exitCode: 0,
    });
    expect((result as { output: string }).output).toMatch(/Visibility\s+DRAFT/);
  });

  it('sends only the name when nothing else is given', async () => {
    const fetchMock = mockResponses({
      status: 201,
      body: { slug: 'me-mixes', name: 'Mixes', type: 'CUSTOM', isPublic: true },
    });

    const output = await runCollectionsCreate(TEST_CONFIG, 'Mixes', {
      json: true,
    });

    expect(sent(fetchMock, 0).body).toEqual({ name: 'Mixes' });
    expect(JSON.parse(output as string)).toMatchObject({
      slug: 'me-mixes',
      cover: null,
    });
  });

  it('keeps the collection and exits with 1 when the cover cannot be fetched', async () => {
    mockResponses(
      { status: 201, body: { slug: 'x', name: 'X', visibility: 'PUBLIC' } },
      { status: 422, body: { error: 'Not an image' } },
    );

    const result = await runCollectionsCreate(TEST_CONFIG, 'X', {
      coverUrl: 'https://example.test/page.html',
    });

    expect(result).toMatchObject({ exitCode: 1 });
    expect((result as { output: string }).output).toContain(
      'not set (Not an image (HTTP 422))',
    );
  });

  it('answers a taken slug with the API message', async () => {
    mockResponses({ status: 409, body: { error: 'Slug already taken' } });

    await expect(
      runCollectionsCreate(TEST_CONFIG, 'X', { slug: 'taken' }),
    ).rejects.toThrow('Slug already taken (HTTP 409)');
  });
});

describe('collectionCreateBody', () => {
  it('rejects an empty or too long name and a too long description', () => {
    expect(() => collectionCreateBody({ name: '  ' })).toThrow(
      'Missing collection name',
    );
    expect(() => collectionCreateBody({ name: 'x'.repeat(101) })).toThrow(
      'collections allow 100',
    );
    expect(() =>
      collectionCreateBody({ name: 'x', description: 'y'.repeat(1001) }),
    ).toThrow('collections allow 1000');
  });
});

describe('parseCollectionVisibility', () => {
  it('maps --private to DRAFT and checks --visibility', () => {
    expect(parseCollectionVisibility({ private: true })).toBe('DRAFT');
    expect(parseCollectionVisibility({ visibility: 'unlisted' })).toBe(
      'UNLISTED',
    );
    expect(parseCollectionVisibility({})).toBeNull();
    expect(() =>
      parseCollectionVisibility({ visibility: 'public', private: true }),
    ).toThrow('disagree');
    expect(() => parseCollectionVisibility({ visibility: 'secret' })).toThrow(
      'Expected one of: public, unlisted, draft',
    );
  });
});
