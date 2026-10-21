import { apiGet, CliError } from '../api-client.mjs';
import { formatDate, formatDetails, formatDuration } from '../format.mjs';

export async function fetchLibrarySound(config, id) {
  if (!id) {
    throw new CliError('Missing sound id. Usage: tahti library show <id>');
  }
  return apiGet(`/api/me/sound/${encodeURIComponent(id)}`, config);
}

function formatAudioFormat(sound) {
  const parts = [
    sound.sourceFormat,
    sound.sourceBitrateKbps ? `${sound.sourceBitrateKbps} kbps` : null,
    sound.sourceSampleRateHz ? `${sound.sourceSampleRateHz} Hz` : null,
    sound.sourceBitDepth ? `${sound.sourceBitDepth}-bit` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

function formatVisibility(isPublic) {
  if (isPublic === true) {
    return 'public';
  }
  if (isPublic === false) {
    return 'private';
  }
  return null;
}

export function formatSoundDetails(sound) {
  const genres = [sound.genre, ...(sound.subGenres ?? [])].filter(Boolean);
  return formatDetails([
    ['ID', sound.id],
    ['TITLE', sound.title],
    ['STATUS', sound.status],
    ['DURATION', formatDuration(sound.durationSec ?? null)],
    ['VISIBILITY', formatVisibility(sound.isPublic)],
    ['TYPE', sound.contentType],
    ['GENRE', genres.join(', ')],
    ['BPM', sound.effectiveBpm],
    ['KEY', sound.effectiveKey],
    ['FORMAT', formatAudioFormat(sound)],
    ['RELEASED', formatDate(sound.releasedAt)],
    ['CREATED', formatDate(sound.createdAt)],
  ]);
}

export async function runLibraryShow(config, id, { json = false } = {}) {
  const sound = await fetchLibrarySound(config, id);
  if (json) {
    return JSON.stringify(sound, null, 2);
  }
  return formatSoundDetails(sound);
}
