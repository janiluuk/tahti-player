import { apiGet, CliError } from '../api-client.mjs';
import { fetchLibrarySounds } from '../commands/library-list.mjs';
import { searchTracks } from '../commands/search.mjs';

export function toLibraryPlayItem(sound) {
  return {
    id: sound.id,
    title: sound.title ?? 'Untitled',
    artist: '',
    durationSec: sound.durationSec ?? null,
    kind: 'track',
    source: 'library',
  };
}

export function toSearchPlayItem(track) {
  return {
    id: track.id,
    title: track.title ?? 'Untitled',
    artist: track.artistName || track.channelSlug || '',
    durationSec: track.durationSec ?? null,
    kind: 'track',
    source: 'search',
    // Catalog search rows have no stream URL — play is blocked unless present.
    url: track.streamUrl || track.audioUrl || track.url || null,
  };
}

export function toRadioPlayItem({ id, title, artist, url }) {
  return {
    id,
    title,
    artist: artist ?? '',
    durationSec: null,
    kind: 'live',
    source: 'radio',
    url,
  };
}

export async function loadLibraryItems(config) {
  const sounds = await fetchLibrarySounds(config, { sort: 'newest' });
  return sounds.map(toLibraryPlayItem);
}

export async function loadSearchItems(config, query) {
  const { tracks } = await searchTracks(config, query, { page: 1, limit: 20 });
  return tracks.map(toSearchPlayItem);
}

export async function resolveLibraryPlayUrl(config, soundId) {
  const source = await apiGet(`/api/me/sound/${soundId}/editor/source`, config);
  if (!source?.url) {
    throw new CliError('No playable URL for this sound.');
  }
  return source.url;
}

export async function loadRadioItems(config) {
  const items = [];

  try {
    const channel = await apiGet('/api/channels/tahti-radio', config, {
      auth: false,
    });
    let artist = 'Tahti Radio';
    try {
      const now = await apiGet('/api/v1/radio', config, { auth: false });
      if (now?.live && now.channel?.artistName) {
        artist = now.channel.artistName;
      }
    } catch {
      // now-playing is optional
    }
    if (channel?.hlsUrl) {
      items.push(
        toRadioPlayItem({
          id: 'tahti-radio',
          title: 'Tahti Radio',
          artist,
          url: channel.hlsUrl,
        }),
      );
    } else {
      items.push({
        id: 'tahti-radio',
        title: 'Tahti Radio',
        artist: 'HLS unavailable',
        durationSec: null,
        kind: 'live',
        source: 'radio',
        url: null,
      });
    }
  } catch (error) {
    items.push({
      id: 'tahti-radio',
      title: 'Tahti Radio',
      artist: error?.message ?? 'Failed to load',
      durationSec: null,
      kind: 'live',
      source: 'radio',
      url: null,
    });
  }

  try {
    const body = await apiGet(
      '/api/v1/internet-radio/presets/enabled',
      config,
      { auth: false },
    );
    for (const preset of body.presets ?? []) {
      items.push(
        toRadioPlayItem({
          id: preset.id,
          title: preset.name,
          artist: preset.genre || 'Internet radio',
          url: preset.streamUrl,
        }),
      );
    }
  } catch {
    // presets optional
  }

  return items;
}

export function listLabel(item) {
  if (!item) {
    return '';
  }
  const artist = item.artist ? ` — ${item.artist}` : '';
  return `${item.title}${artist}`;
}
