import { afterEach, describe, expect, it, vi } from 'vitest';

import { CONFIG } from './hearthis-api-stub';
import { runHearthisSyncArtwork } from './hearthis-sync-artwork.mjs';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('hearthis sync-artwork', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sets backdrop and matching sound covers by default', async () => {
    const bannerCalls: string[] = [];
    const fetchImpl = vi.fn(async (input: string, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      if (url.includes('api-v2.hearthis.at/yaniho/?type=tracks')) {
        return json([
          {
            id: '42',
            title: 'Night Drive',
            permalink_url: 'https://hearthis.at/yaniho/night-drive/',
            duration: '180',
            artwork_url: 'https://img.hearthis.at/x/w500_h500_cover.jpg',
          },
        ]);
      }
      if (url.includes('api-v2.hearthis.at/yaniho/')) {
        return json({
          permalink: 'yaniho',
          background_url: 'https://img.hearthis.at/x/w565_h565_bg.jpg',
        });
      }
      if (url.includes('img.hearthis.at') && method !== 'PUT') {
        return new Response(Buffer.from('fake-image'), {
          status: 200,
          headers: { 'Content-Type': 'image/jpeg' },
        });
      }
      if (method === 'PUT') {
        return new Response(null, { status: 200 });
      }
      const path = url.replace(CONFIG.apiUrl, '');
      if (path === '/api/me/profile') {
        return json({
          username: 'yaniho',
          socialLinks: { hearthisAt: 'yaniho' },
        });
      }
      if (path.startsWith('/api/me/sound?')) {
        return json({
          items: [
            {
              id: 'sound-1',
              title: 'Night Drive',
              durationSec: 180,
              status: 'READY',
              hearthisExportId: '42',
            },
          ],
          total: 1,
        });
      }
      if (path === '/api/me/profile/backdrop/prepare' && method === 'POST') {
        return json({
          uploadKey: 'avatars/yaniho/backdrop-abc.jpg',
          uploadUrl: 'https://storage.test/backdrop',
        });
      }
      if (path === '/api/me/profile/backdrop/complete' && method === 'POST') {
        return json({
          backdropUrl: 'https://cdn.test/avatars/yaniho/backdrop-abc.jpg',
        });
      }
      if (
        path === '/api/me/sound/sound-1/banner/from-url' &&
        method === 'POST'
      ) {
        bannerCalls.push(path);
        return json({ url: 'https://cdn.test/sound/sound-1/banner.jpg' });
      }
      return json({ error: `unexpected ${method} ${path}` }, 500);
    });

    vi.stubGlobal('fetch', fetchImpl);
    const result = await runHearthisSyncArtwork(
      { ...CONFIG, token: 'tahti_test' },
      { fetchImpl, handle: 'yaniho', json: true },
    );
    const body = JSON.parse(result.output);
    expect(body.backdrop.status).toBe('set');
    expect(body.coverArt).toEqual([
      expect.objectContaining({ soundId: 'sound-1', status: 'set' }),
    ]);
    expect(bannerCalls).toEqual(['/api/me/sound/sound-1/banner/from-url']);
    expect(result.exitCode).toBe(0);
  });

  it('honours coverArt: false and backdrop: false', async () => {
    const fetchImpl = vi.fn(async (input: string) => {
      if (String(input).includes('api-v2.hearthis.at')) {
        return json({
          permalink: 'yaniho',
          background_url: 'https://img.hearthis.at/bg.jpg',
        });
      }
      return json({ error: 'unexpected' }, 500);
    });
    vi.stubGlobal('fetch', fetchImpl);
    const result = await runHearthisSyncArtwork(
      { ...CONFIG, token: 'tahti_test' },
      {
        fetchImpl,
        handle: 'yaniho',
        coverArt: false,
        backdrop: false,
        json: true,
      },
    );
    const body = JSON.parse(result.output);
    expect(body.coverArt).toBeNull();
    expect(body.backdrop).toBeNull();
    expect(result.exitCode).toBe(0);
  });
});
