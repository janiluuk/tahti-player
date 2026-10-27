import { describe, expect, it } from 'vitest';

import {
  bandcampEmbedSrc,
  EMBED_PROVIDER_HEIGHT,
  EMBED_PROVIDER_LABEL,
  embedSrcFor,
  hearthisEmbedSrc,
  spotifyEmbedSrc,
  type EmbedProvider,
} from './embedSrc';

const PROVIDERS: EmbedProvider[] = [
  'HEARTHIS',
  'MIXCLOUD',
  'SPOTIFY',
  'BANDCAMP',
  'MIKSERI',
];

const URI: Record<EmbedProvider, string> = {
  HEARTHIS: 'demo',
  MIXCLOUD: 'demo',
  SPOTIFY: 'demo',
  BANDCAMP: 'demo',
  MIKSERI: 'https://www.mikseri.net/embed/?type=1&parameter=635878',
};

describe('embedSrcFor', () => {
  it('every provider resolves through the dispatcher and has label/height metadata', () => {
    for (const provider of PROVIDERS) {
      expect(embedSrcFor(provider, URI[provider])).toContain('https://');
      expect(EMBED_PROVIDER_LABEL[provider].length).toBeGreaterThan(0);
      expect(EMBED_PROVIDER_HEIGHT[provider]).toBeGreaterThan(0);
    }
  });
});

describe('bandcampEmbedSrc', () => {
  it('treats a bare numeric id as a track id', () => {
    expect(bandcampEmbedSrc('2263268826')).toBe(
      'https://bandcamp.com/EmbeddedPlayer/track=2263268826/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/transparent=true/',
    );
  });

  it('passes through an already-qualified track= or album= spec', () => {
    expect(bandcampEmbedSrc('album=123')).toContain('album=123');
  });
});

describe('hearthisEmbedSrc', () => {
  it('uses the tall style-2 chrome by default', () => {
    expect(hearthisEmbedSrc('demo')).toContain('style=2');
  });

  it('uses the short style-1 chrome when compact', () => {
    expect(hearthisEmbedSrc('demo', { compact: true })).toContain('style=1');
    expect(embedSrcFor('HEARTHIS', 'demo', { compact: true })).toContain(
      'style=1',
    );
  });
});

describe('spotifyEmbedSrc', () => {
  it('converts a spotify: URI to an /embed/ path', () => {
    expect(spotifyEmbedSrc('spotify:track:abc123')).toBe(
      'https://open.spotify.com/embed/track/abc123',
    );
  });

  it('treats a bare id as a track id', () => {
    expect(spotifyEmbedSrc('abc123')).toBe(
      'https://open.spotify.com/embed/track/abc123',
    );
  });
});
