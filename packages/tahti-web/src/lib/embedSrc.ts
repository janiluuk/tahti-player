import type { EmbedPlaybackProvider } from '../api/types';

/** Providers whose tracks are referenced, never re-hosted: the backend
 * stores only an embedUri and marks the archive item EMBED_ONLY, so the
 * audio and artwork have to come from the provider's own widget. */
export type EmbedProvider =
  'HEARTHIS' | 'MIXCLOUD' | 'SPOTIFY' | 'BANDCAMP' | 'MIKSERI';

/** Lowercase playback key used on `TahtiPlayable.embed.provider`; the
 * lowercase of the API's `EmbedProvider` is itself the playback form. */
export function toEmbedPlaybackProvider(
  p: EmbedProvider,
): EmbedPlaybackProvider {
  return p.toLowerCase() as EmbedPlaybackProvider;
}

/** Mirrors hearthisEmbedSrc in the main tahti repo (packages/shared).
 * waveform/cover stay on: the widget hides its play control until that
 * UI initializes, so turning both off leaves nothing clickable.
 * `compact` drops the tall style-2 chrome so the player-bar strip stays
 * short enough that Library Tracks still shows its list. */
export function hearthisEmbedSrc(
  trackId: string,
  options?: { compact?: boolean },
): string {
  const compact = options?.compact === true;
  const params = new URLSearchParams({
    hcolor: '55acee',
    color: '',
    style: compact ? '1' : '2',
    block_size: '2',
    block_space: '2',
    background: '1',
    waveform: '1',
    cover: '1',
    autoplay: '0',
    css: '',
  });
  return `https://hearthis.at/embed/${encodeURIComponent(trackId)}/transparent_black/?${params.toString()}`;
}

export function mixcloudEmbedSrc(key: string): string {
  return `https://player-widget.mixcloud.com/widget/iframe/?feed=${encodeURIComponent(key)}&hide_cover=1&light=0`;
}

export function spotifyEmbedSrc(uri: string): string {
  // spotify:track:ID → /embed/track/ID
  const path = uri.startsWith('spotify:')
    ? uri.slice('spotify:'.length).replace(/:/g, '/')
    : `track/${uri}`;
  return `https://open.spotify.com/embed/${path}`;
}

/** Bandcamp has no public REST embed lookup — the widget is addressed by
 * the numeric track/album id Bandcamp itself assigns, formatted as
 * `track=<id>` or `album=<id>`. The import contract is expected to hand
 * back `embedUri` already in that shape; a bare numeric id is treated as
 * a track id. */
export function bandcampEmbedSrc(uri: string): string {
  const spec = uri.includes('=') ? uri : `track=${uri}`;
  return `https://bandcamp.com/EmbeddedPlayer/${spec}/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/transparent=true/`;
}

export function mikseriEmbedSrc(uri: string): string | null {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return null;
  }
  if (
    url.hostname.replace(/^www\./, '').toLowerCase() !== 'mikseri.net' ||
    (url.pathname !== '/embed/' && url.pathname !== '/embed')
  ) {
    return null;
  }
  return url.toString();
}

export function embedSrcFor(
  provider: EmbedProvider,
  uri: string,
  options?: { compact?: boolean },
): string | null {
  switch (provider) {
    case 'HEARTHIS':
      return hearthisEmbedSrc(uri, options);
    case 'MIXCLOUD':
      return mixcloudEmbedSrc(uri);
    case 'SPOTIFY':
      return spotifyEmbedSrc(uri);
    case 'BANDCAMP':
      return bandcampEmbedSrc(uri);
    case 'MIKSERI':
      return mikseriEmbedSrc(uri);
    default:
      return null;
  }
}

export const EMBED_PROVIDER_LABEL: Record<EmbedProvider, string> = {
  HEARTHIS: 'hearthis.at',
  MIXCLOUD: 'Mixcloud',
  SPOTIFY: 'Spotify',
  BANDCAMP: 'Bandcamp',
  MIKSERI: 'Mikseri.net',
};

/** Widget heights differ enough that one value looks broken on the others. */
export const EMBED_PROVIDER_HEIGHT: Record<EmbedProvider, number> = {
  HEARTHIS: 150,
  MIXCLOUD: 120,
  SPOTIFY: 152,
  BANDCAMP: 120,
  MIKSERI: 190,
};

/** Display name keyed by the lowercase playback form found on
 * `TahtiPlayable.embed.provider`; derived from the uppercase map so the two
 * never drift. */
export const EMBED_PLAYBACK_PROVIDER_LABEL: Record<
  EmbedPlaybackProvider,
  string
> = {
  hearthis: EMBED_PROVIDER_LABEL.HEARTHIS,
  mixcloud: EMBED_PROVIDER_LABEL.MIXCLOUD,
  spotify: EMBED_PROVIDER_LABEL.SPOTIFY,
  bandcamp: EMBED_PROVIDER_LABEL.BANDCAMP,
  mikseri: EMBED_PROVIDER_LABEL.MIKSERI,
};
