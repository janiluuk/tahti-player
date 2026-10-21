import { apiSendJson, CliError } from '../api-client.mjs';
import { formatSoundDetails } from './library-show.mjs';

export const MAX_TAGS = 20;

function parseList(flag, value, max) {
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (items.length > max) {
    throw new CliError(`Too many values for ${flag}: at most ${max}.`);
  }
  return items;
}

function parseBpm(value) {
  if (value === 'none') {
    return null;
  }
  const bpm = Number(value);
  if (!Number.isInteger(bpm) || bpm < 40 || bpm > 300) {
    throw new CliError(
      `Invalid --bpm "${value}". Expected 40-300, or "none" to clear it.`,
    );
  }
  return bpm;
}

export function buildSoundPatch(options) {
  if (options.public && options.private) {
    throw new CliError('Give --public or --private, not both.');
  }
  const patch = {};
  if (options.title !== undefined) {
    const title = options.title.trim();
    if (!title) {
      throw new CliError('--title cannot be empty.');
    }
    patch.title = title;
  }
  if (options.description !== undefined) {
    patch.description = options.description;
  }
  if (options.genre !== undefined) {
    patch.genre = options.genre.trim() || null;
  }
  if (options.tags !== undefined) {
    patch.tags = parseList('--tags', options.tags, MAX_TAGS);
  }
  if (options.bpm !== undefined) {
    patch.bpm = parseBpm(options.bpm);
  }
  if (options.key !== undefined) {
    patch.musicalKey = options.key.trim() || null;
  }
  if (options.public) {
    patch.isPublic = true;
  }
  if (options.private) {
    patch.isPublic = false;
  }
  if (options.downloads !== undefined) {
    if (options.downloads !== 'on' && options.downloads !== 'off') {
      throw new CliError(
        `Invalid --downloads "${options.downloads}". Expected on or off.`,
      );
    }
    patch.downloadsEnabled = options.downloads === 'on';
  }
  if (Object.keys(patch).length === 0) {
    throw new CliError(
      'Nothing to change.\nRun `tahti library edit --help` for the fields you can set.',
    );
  }
  return patch;
}

export async function runLibraryEdit(config, id, options = {}) {
  if (!id) {
    throw new CliError(
      'Missing sound id.\nRun `tahti library edit --help` for usage.',
    );
  }
  const patch = buildSoundPatch(options);
  const sound = await apiSendJson(
    'PATCH',
    `/api/me/sound/${encodeURIComponent(id)}`,
    patch,
    config,
  );
  if (options.json) {
    return JSON.stringify(sound, null, 2);
  }
  return formatSoundDetails(sound);
}
