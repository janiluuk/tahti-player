import { apiPost, CliError } from '../api-client.mjs';
import { tracksFromSounds } from './releases-create.mjs';
import {
  fetchRelease,
  formatReleaseDetails,
  formatTracklist,
} from './releases-show.mjs';

export async function runReleasesAddTracks(config, id, options = {}) {
  const soundIds = options.sound ?? [];
  if (!id) {
    throw new CliError(
      'Missing release id.\nRun `tahti releases add-tracks --help` for usage.',
    );
  }
  if (soundIds.length === 0) {
    throw new CliError(
      'Give at least one --sound <id>.\nRun `tahti releases add-tracks --help` for usage.',
    );
  }
  // Read first so a wrong release id fails before any sound lookups.
  await fetchRelease(config, id);
  const tracks = await tracksFromSounds(config, soundIds);
  const path = `/api/me/releases/${encodeURIComponent(id)}/tracks`;
  const added = [];
  for (const track of tracks) {
    try {
      added.push(await apiPost(path, track, config));
    } catch (error) {
      const prefix =
        added.length > 0
          ? `Added ${added.length} of ${tracks.length} tracks, then: `
          : '';
      throw new CliError(`${prefix}${error?.message ?? error}`);
    }
  }
  if (options.json) {
    return JSON.stringify(added, null, 2);
  }
  const release = await fetchRelease(config, id);
  const count = added.length === 1 ? '1 track' : `${added.length} tracks`;
  return `Added ${count} to "${release.title}".\n\n${formatReleaseDetails(release)}\n\n${formatTracklist(release.tracks ?? [])}`;
}
