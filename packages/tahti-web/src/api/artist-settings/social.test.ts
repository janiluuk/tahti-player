import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchSocialConnections,
  patchSocialConnections,
  socialConnectionsFromLinks,
} from './social';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

describe('social connections', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps the profile socialLinks bag', () => {
    const connections = socialConnectionsFromLinks({
      bandcamp: 'https://a.bandcamp.com',
      showConnections: 'false',
      genres: 'techno',
    });
    expect(connections.bandcamp).toBe('https://a.bandcamp.com');
    expect(connections.instagram).toBe('');
    expect(connections.showConnections).toBe(false);
    expect('genres' in connections).toBe(false);
    expect(socialConnectionsFromLinks(null).showConnections).toBe(true);
  });

  it('reads the links from the profile', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(json({ socialLinks: { soundcloud: 'sc' } }));
    const result = await fetchSocialConnections();
    expect(result.data.soundcloud).toBe('sc');
    expect(fetchSpy.mock.calls[0]![0]).toBe('/tahti-api/api/me/profile');
  });

  it('merges a save into the stored links so genre tags survive', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        json({ socialLinks: { genres: 'techno,house', website: 'old' } }),
      )
      .mockResolvedValueOnce(
        json({
          socialLinks: {
            genres: 'techno,house',
            website: 'https://new.example',
            showConnections: 'false',
          },
        }),
      );
    const result = await patchSocialConnections({
      website: ' https://new.example ',
      showConnections: false,
    });
    const [, init] = fetchSpy.mock.calls[1]!;
    expect(init!.method).toBe('PATCH');
    expect(JSON.parse(init!.body as string)).toEqual({
      socialLinks: {
        genres: 'techno,house',
        website: 'https://new.example',
        showConnections: 'false',
      },
    });
    expect(result).toMatchObject({
      ok: true,
      data: { website: 'https://new.example', showConnections: false },
    });
  });

  it('passes on a failed save', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json({ socialLinks: {} }))
      .mockResolvedValueOnce(json({ error: 'Invalid request body' }, 400));
    await expect(patchSocialConnections({ website: 'x' })).resolves.toEqual({
      ok: false,
      error: 'Invalid request body',
    });
  });
});
