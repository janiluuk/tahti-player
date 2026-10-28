import { apiGet, CliError } from '../api-client.mjs';
import {
  formatDate,
  formatDetails,
  formatDuration,
  safeName,
} from '../format.mjs';

function count(value) {
  return value == null ? null : value.toLocaleString('en');
}

/** A public track by id or /t/<id> link: who made it, what it is and its
 * public totals. Public route; the token is not sent. */
export async function runTrack(config, idOrUrl, { json = false } = {}) {
  const id = idOrUrl
    ?.trim()
    .replace(/^.*\/t\//, '')
    .replace(/[/?#].*$/, '');
  if (!id) {
    throw new CliError('Give a track id or a /t/<id> link.');
  }
  const track = await apiGet(
    `/api/v1/tracks/${encodeURIComponent(id)}`,
    config,
    { auth: false },
  );
  if (json) {
    return JSON.stringify(track, null, 2);
  }
  const artist = safeName(
    track.artistName,
    track.channel?.user?.username ?? 'unknown',
  );
  const rows = [
    ['Title', track.title],
    ['Artist', artist],
    ['Length', formatDuration(track.durationSec ?? null)],
    ['Genre', track.genre ?? null],
    ['Released', track.releasedAt ? formatDate(track.releasedAt) : null],
    ['Plays', count(track.playCount)],
    ['Likes', count(track.likeCount)],
    ['Downloads', count(track.downloadCount)],
    ['Comments', count(track.commentCount)],
  ].filter(([, value]) => value != null && value !== '');
  return formatDetails(rows);
}
