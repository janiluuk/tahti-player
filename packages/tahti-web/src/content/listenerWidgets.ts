/** Listener widgets — pluggable, app-store-style embeds that play content
 * from an external platform inline on the Listen page, using that
 * platform's own official embedded player (SoundCloud's Widget API,
 * Spotify's playlist embed, YouTube's IFrame Player API, hearthis.at's
 * iframe widget, and Bandcamp's EmbeddedPlayer). This is deliberately not a
 * port of
 * Nuclear desktop's StreamProvider plugin system (search/resolve/stream
 * through a sandboxed plugin host) — a browser can't proxy audio out of
 * SoundCloud/YouTube without violating their ToS, so "playing" their
 * content here means embedding the real widget, the same way any website
 * legitimately does.
 */

export type ListenerWidgetTypeId =
  | 'soundcloud'
  | 'spotify'
  | 'youtube'
  | 'hearthis'
  | 'bandcamp';

export type ListenerWidgetType = {
  id: ListenerWidgetTypeId;
  name: string;
  author: string;
  description: string;
  category: string;
  placeholder: string;
  helpText: string;
  /** Height for the embedded iframe — SoundCloud tracks/playlists and
   * YouTube videos read at very different aspect ratios. */
  embedHeight: number;
  /** Turns a pasted URL into an embeddable player src, or null if the
   * input isn't a recognized URL shape for this platform. */
  toEmbedUrl: (input: string) => string | null;
};

function soundcloudEmbedUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!/^https:\/\/(www\.)?soundcloud\.com\/\S+/i.test(trimmed)) {
    return null;
  }
  const params = new URLSearchParams({
    url: trimmed,
    color: '%23ff5500',
    auto_play: 'false',
    show_user: 'true',
    show_reposts: 'false',
    visual: 'false',
  });
  return `https://w.soundcloud.com/player/?${params.toString()}`;
}

// Unlike SoundCloud/YouTube/Spotify, Bandcamp's embed iframe can't be
// derived from a plain track/album page URL — it needs the numeric
// track/album id Bandcamp's own "Share/Embed" panel encodes into the
// generated `bandcamp.com/EmbeddedPlayer/...` link. Same shape as
// hearthisEmbedUrl below: accept the platform's own embed-ready URL rather
// than pretending to resolve one client-side.
function bandcampEmbedUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (host !== 'bandcamp.com' || !url.pathname.startsWith('/EmbeddedPlayer/')) {
    return null;
  }
  return url.toString();
}

export function soundcloudProfileUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  const pathParts = url.pathname.split('/').filter(Boolean);
  if (
    host !== 'soundcloud.com' ||
    pathParts.length !== 1 ||
    url.search ||
    url.hash
  ) {
    return null;
  }
  return `https://soundcloud.com/${pathParts[0]}`;
}

function youtubeIds(input: string): {
  videoId: string | null;
  playlistId: string | null;
} {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return { videoId: null, playlistId: null };
  }
  const host = url.hostname.replace(/^www\./, '');
  if (host === 'youtu.be') {
    return { videoId: url.pathname.slice(1) || null, playlistId: null };
  }
  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const playlistId = url.searchParams.get('list');
    if (url.pathname === '/watch') {
      return { videoId: url.searchParams.get('v'), playlistId };
    }
    if (url.pathname.startsWith('/embed/')) {
      return { videoId: url.pathname.split('/')[2] ?? null, playlistId };
    }
    if (url.pathname === '/playlist') {
      return { videoId: null, playlistId };
    }
  }
  return { videoId: null, playlistId: null };
}

function youtubeEmbedUrl(input: string): string | null {
  const { videoId, playlistId } = youtubeIds(input);
  if (videoId) {
    return playlistId
      ? `https://www.youtube-nocookie.com/embed/${videoId}?list=${playlistId}`
      : `https://www.youtube-nocookie.com/embed/${videoId}`;
  }
  if (playlistId) {
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}`;
  }
  return null;
}

function spotifyPlaylistEmbedUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  const pathParts = url.pathname.split('/').filter(Boolean);
  if (
    host !== 'open.spotify.com' ||
    pathParts.length !== 2 ||
    pathParts[0] !== 'playlist' ||
    !/^[A-Za-z0-9]+$/.test(pathParts[1])
  ) {
    return null;
  }
  return `https://open.spotify.com/embed/playlist/${encodeURIComponent(pathParts[1])}`;
}

function hearthisEmbedUrl(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) {
    return hearthisEmbedUrlForId(trimmed);
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '');
  const pathParts = url.pathname.split('/').filter(Boolean);
  if (host !== 'hearthis.at') {
    return null;
  }
  if (
    pathParts[0]?.toLowerCase() === 'embed' &&
    /^\d+$/.test(pathParts[1] ?? '')
  ) {
    return hearthisEmbedUrlForId(pathParts[1]);
  }
  // Set embeds look like hearthis.at/set/<setId>-<userId>/embed/<token>/ —
  // the token isn't derivable from the id, so a resolved set embed URL
  // (from resolveHearthisPageEmbedUrl below) is accepted as-is.
  if (
    pathParts[0]?.toLowerCase() === 'set' &&
    /^\d+-\d+$/.test(pathParts[1] ?? '') &&
    pathParts[2]?.toLowerCase() === 'embed' &&
    pathParts[3]
  ) {
    return url.toString();
  }
  return null;
}

/** Resolves any public hearthis.at track/set page URL to its real embed
 * iframe src via the platform's own oEmbed endpoint — the embed token in
 * set URLs (and some track URLs) can't be derived client-side, so this
 * asks hearthis.at for the canonical embed markup instead of guessing.
 * Returns null for non-hearthis.at URLs or on any fetch/parse failure. */
export async function resolveHearthisPageEmbedUrl(
  pageUrl: string,
): Promise<string | null> {
  let url: URL;
  try {
    url = new URL(pageUrl.trim());
  } catch {
    return null;
  }
  if (url.hostname.replace(/^www\./, '') !== 'hearthis.at') {
    return null;
  }
  const oembedUrl = `${url.origin}${url.pathname.replace(/\/?$/, '/')}oembed.json`;
  try {
    const res = await fetch(oembedUrl);
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as { html?: string };
    const src = data.html?.match(/src="([^"]+)"/)?.[1];
    return src ?? null;
  } catch {
    return null;
  }
}

export type HearthisSet = {
  id: string;
  title: string;
  description: string;
  trackCount: number;
  thumbUrl: string;
  pageUrl: string;
};

/** Lists a hearthis.at user's public sets (playlists) via their API, for
 * "browse my sets to embed" in the widget config UI. Each result's
 * `pageUrl` still needs resolveHearthisPageEmbedUrl() to get an embed src
 * — the set-embed token isn't included in this listing. */
export async function fetchHearthisUserSets(
  username: string,
): Promise<HearthisSet[] | null> {
  const handle = username.trim().replace(/^@/, '');
  if (!/^[a-zA-Z0-9_-]+$/.test(handle)) {
    return null;
  }
  try {
    const res = await fetch(
      `https://api-v2.hearthis.at/${encodeURIComponent(handle)}/?type=playlists&page=1&count=50`,
    );
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) {
      return null;
    }
    return data.map((raw) => {
      const set = raw as Record<string, unknown>;
      return {
        id: String(set.id ?? ''),
        title: String(set.title ?? 'Untitled set'),
        description: String(set.description ?? ''),
        trackCount: Number(set.track_count ?? 0),
        thumbUrl: String(set.thumb ?? ''),
        pageUrl: String(set.permalink_url ?? ''),
      };
    });
  } catch {
    return null;
  }
}

function hearthisEmbedUrlForId(trackId: string): string {
  const params = new URLSearchParams({
    hcolor: '55acee',
    color: '',
    style: '2',
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

export const LISTENER_WIDGET_TYPES: ListenerWidgetType[] = [
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    author: 'SoundCloud',
    description:
      "Play a SoundCloud track, set, playlist, or an artist's public profile (their recent public tracks) inline using SoundCloud's own embedded player.",
    category: 'Streaming',
    placeholder: 'https://soundcloud.com/artist/track',
    helpText:
      'Paste a SoundCloud track, set, or playlist URL — or an artist profile URL for a rolling feed of their public tracks.',
    embedHeight: 166,
    toEmbedUrl: soundcloudEmbedUrl,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    author: 'YouTube',
    description:
      "Play a YouTube video or playlist inline using YouTube's own embedded player.",
    category: 'Streaming',
    placeholder: 'https://www.youtube.com/watch?v=…',
    helpText: 'Paste a YouTube video or playlist URL.',
    embedHeight: 220,
    toEmbedUrl: youtubeEmbedUrl,
  },
  {
    id: 'spotify',
    name: 'Spotify',
    author: 'Spotify',
    description:
      "Play a specific Spotify playlist inline using Spotify's official embedded player.",
    category: 'Streaming',
    placeholder: 'https://open.spotify.com/playlist/…',
    helpText: 'Paste a public Spotify playlist URL.',
    embedHeight: 352,
    toEmbedUrl: spotifyPlaylistEmbedUrl,
  },
  {
    id: 'hearthis',
    name: 'hearthis.at',
    author: 'hearthis.at',
    description:
      "Play a hearthis.at track or set inline using hearthis.at's official embedded player.",
    category: 'Streaming',
    placeholder:
      'https://hearthis.at/yourname/your-track/ or a numeric track ID',
    helpText:
      'Paste any hearthis.at track or set link (or a numeric track ID) — the embed resolves automatically. Or browse your own sets below.',
    embedHeight: 150,
    toEmbedUrl: hearthisEmbedUrl,
  },
  {
    id: 'bandcamp',
    name: 'Bandcamp',
    author: 'Bandcamp',
    description:
      "Play a Bandcamp track or album inline using Bandcamp's own embedded player.",
    category: 'Streaming',
    placeholder: 'https://bandcamp.com/EmbeddedPlayer/album=…',
    helpText:
      "On the Bandcamp track/album page, use Share / Embed → paste the generated bandcamp.com/EmbeddedPlayer/… link here (a plain bandcamp.com page URL doesn't carry the id Bandcamp's embed needs).",
    embedHeight: 120,
    toEmbedUrl: bandcampEmbedUrl,
  },
];

export function listenerWidgetType(id: string): ListenerWidgetType | undefined {
  return LISTENER_WIDGET_TYPES.find((t) => t.id === id);
}

export type ResolvedListenerWidgetInput =
  | { ok: true; input: string; saveSoundcloudProfile: boolean }
  | { ok: false; error: string };

export function resolveListenerWidgetInput(
  typeId: string,
  rawInput: string,
): ResolvedListenerWidgetInput {
  const input = rawInput.trim();
  const type = listenerWidgetType(typeId);
  if (!type) {
    return { ok: false, error: 'Unknown add-on.' };
  }
  if (!input) {
    return {
      ok: false,
      error:
        typeId === 'soundcloud'
          ? 'Add a SoundCloud profile, track, set, or playlist URL.'
          : `Add a ${type.name} link.`,
    };
  }
  if (typeId === 'soundcloud') {
    const profile = soundcloudProfileUrl(input);
    if (profile) {
      return { ok: true, input: profile, saveSoundcloudProfile: true };
    }
    if (type.toEmbedUrl(input)) {
      return { ok: true, input, saveSoundcloudProfile: false };
    }
    return {
      ok: false,
      error:
        'Use a SoundCloud profile, track, set, or playlist URL such as https://soundcloud.com/your-name.',
    };
  }
  if (!type.toEmbedUrl(input)) {
    return {
      ok: false,
      error: `Couldn't recognize this ${type.name} link. ${type.helpText}`,
    };
  }
  return { ok: true, input, saveSoundcloudProfile: false };
}
