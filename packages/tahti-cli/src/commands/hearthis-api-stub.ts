import { readFileSync } from 'node:fs';
import { expect, vi } from 'vitest';

import { TEST_CONFIG } from '../test-helpers';

export const CONFIG = { ...TEST_CONFIG, apiUrl: 'https://api.tahti.test' };
export const API = CONFIG.apiUrl;
export const SET_URL = 'https://hearthis.at/set/378936-9675121/';

export const fixture = (name: string) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'),
  );

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export type Call = { method: string; url: string; body: unknown };

export type LibrarySound = {
  id: string;
  title: string;
  durationSec: number | null;
  status?: string;
  embedProvider?: string | null;
  hearthisExportId?: string | null;
};

type Item = { id: string; soundId: string; position: number };
type Collection = {
  slug: string;
  name: string;
  type?: string;
  visibility?: string;
  items: Item[];
};

/**
 * A fake Tahti API plus hearthis.at for the hearthis → release / collection
 * flows. Uploaded sounds join `library` (status PROCESSING) the way the real
 * library lists a fresh upload; `stillProcessing` keeps them in
 * /api/me/sound/processing and makes adding them answer SOUND_NOT_READY.
 */
export function stubApis({
  catalog = fixture('tahti-hearthis-set-tracks.json'),
  releases = [] as { id: string; title: string }[],
  failUploadOf = null as string | null,
  library = [] as LibrarySound[],
  collections = [] as Collection[],
  stillProcessing = false,
} = {}) {
  const calls: Call[] = [];
  let uploads = 0;
  const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET';
    const body =
      typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
    calls.push({ method, url, body });
    const path = url.startsWith(API) ? url.slice(API.length) : url;
    if (path.startsWith('/api/v1/imports/hearthis/sets/')) {
      return json(catalog);
    }
    if (url.startsWith('https://api-v2.hearthis.at/')) {
      return json(fixture('hearthis-track.json'));
    }
    if (path.startsWith('/api/me/releases?')) {
      return json({ releases, total: releases.length, page: 1, limit: 100 });
    }
    if (url.startsWith('https://hearthis.app/')) {
      return new Response(`audio:${url}`, {
        headers: { 'content-type': 'audio/wav' },
      });
    }
    if (path === '/api/uploads/prepare') {
      const id = `up-${++uploads}`;
      if (failUploadOf && (body as { title: string }).title === failUploadOf) {
        return json({ error: 'Storage is full' }, 507);
      }
      return json({ uploadId: id, uploadUrl: `https://storage.test/${id}` });
    }
    if (url.startsWith('https://storage.test/')) {
      return new Response(null, { headers: { etag: '"e"' } });
    }
    if (path === '/api/uploads/complete') {
      const { uploadId, title } = body as { uploadId: string; title: string };
      const id = `sound-${uploadId.slice(3)}`;
      library.push({ id, title, durationSec: null, status: 'PROCESSING' });
      return json({ itemId: id });
    }
    if (path.startsWith('/api/me/sound?')) {
      const query = new URL(url).searchParams;
      const limit = Number(query.get('limit'));
      const offset = Number(query.get('offset'));
      expect(limit).toBeLessThanOrEqual(100);
      return json({
        items: library.slice(offset, offset + limit),
        total: library.length,
      });
    }
    if (path === '/api/me/sound/processing') {
      return json({
        processing: stillProcessing
          ? library
              .filter((sound) => sound.status === 'PROCESSING')
              .map(({ id, title }) => ({ id, title, status: 'PROCESSING' }))
          : [],
      });
    }
    if (path.startsWith('/api/me/sound/')) {
      const id = decodeURIComponent(path.split('/').pop() ?? '');
      return json({ id, title: `title of ${id}`, durationSec: null });
    }
    if (path === '/api/me/releases' && method === 'POST') {
      return json({ id: 'rel-1', title: (body as { title: string }).title });
    }
    if (path === '/api/me/releases/rel-1/artwork/from-url') {
      return json({ artworkUrl: 'https://cdn.tahti.test/a.jpg' });
    }
    if (path === '/api/me/collections' && method === 'GET') {
      return json(
        collections.map(({ items, ...rest }) => ({
          ...rest,
          _count: { items: items.length },
        })),
      );
    }
    if (path === '/api/me/collections' && method === 'POST') {
      const input = body as {
        name: string;
        slug?: string;
        type?: string;
        visibility?: string;
      };
      const created: Collection = {
        slug: input.slug ?? 'yaniho-recorded-sets-from-gigs',
        name: input.name,
        type: input.type ?? 'CUSTOM',
        visibility: input.visibility ?? 'PUBLIC',
        items: [],
      };
      collections.push(created);
      return json(created, 201);
    }
    const match = /^\/api\/me\/collections\/([^/]+)(\/.*)?$/.exec(path);
    if (match) {
      const collection = collections.find(
        (entry) => entry.slug === decodeURIComponent(match[1]),
      );
      if (!collection) {
        return json({ error: 'Collection not found' }, 404);
      }
      if (!match[2] && method === 'GET') {
        return json({
          ...collection,
          items: [...collection.items].sort((a, b) => a.position - b.position),
        });
      }
      if (match[2] === '/cover/from-url') {
        return json({ url: 'https://cdn.tahti.test/cover.jpg' });
      }
      if (match[2] === '/items' && method === 'POST') {
        const { soundId, position } = body as {
          soundId: string;
          position?: number;
        };
        if (collection.items.some((item) => item.soundId === soundId)) {
          return json({ error: 'Already in this playlist' }, 409);
        }
        const sound = library.find((entry) => entry.id === soundId);
        if (stillProcessing && sound?.status === 'PROCESSING') {
          return json(
            {
              error: 'This track is still processing. Add it once it is ready.',
              code: 'SOUND_NOT_READY',
            },
            409,
          );
        }
        const at =
          position ??
          Math.max(0, ...collection.items.map((item) => item.position)) + 1;
        for (const item of collection.items) {
          if (item.position >= at) {
            item.position += 1;
          }
        }
        const item = { id: `item-${soundId}`, soundId, position: at };
        collection.items.push(item);
        return json(item, 201);
      }
    }
    throw new Error(`unexpected ${method} ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { calls, library, collections };
}

export function collectionOrder(collection: Collection) {
  return [...collection.items]
    .sort((a, b) => a.position - b.position)
    .map((item) => item.soundId);
}
