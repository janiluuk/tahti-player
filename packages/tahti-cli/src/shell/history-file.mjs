import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { configPath } from '../config-file.mjs';
import { HISTORY_LIMIT } from './state.mjs';

export function historyPath(env = process.env) {
  const config = configPath(env);
  return config ? join(dirname(config), 'shell-history.json') : null;
}

function isSavedTrack(item) {
  return Boolean(
    item &&
    item.kind === 'track' &&
    (typeof item.id === 'string' || typeof item.id === 'number') &&
    typeof item.title === 'string' &&
    typeof item.source === 'string',
  );
}

/** Library play links are signed and short-lived, so they are fetched again
 * on play rather than saved. */
function toSavedTrack(item) {
  const track = {
    id: item.id,
    title: item.title,
    artist: typeof item.artist === 'string' ? item.artist : '',
    durationSec: Number.isFinite(item.durationSec) ? item.durationSec : null,
    kind: 'track',
    source: item.source,
  };
  if (item.source !== 'library' && typeof item.url === 'string') {
    track.url = item.url;
  }
  return track;
}

/** The History pane from earlier sessions against the same API, newest
 * first. A missing or unreadable file gives an empty history. */
export function readShellHistory(apiUrl, env = process.env) {
  const path = historyPath(env);
  if (!path) {
    return [];
  }
  try {
    const saved = JSON.parse(readFileSync(path, 'utf8'));
    if (saved?.apiUrl !== apiUrl || !Array.isArray(saved.tracks)) {
      return [];
    }
    return saved.tracks
      .filter(isSavedTrack)
      .slice(0, HISTORY_LIMIT)
      .map(toSavedTrack);
  } catch {
    return [];
  }
}

export function writeShellHistory(apiUrl, history, env = process.env) {
  const path = historyPath(env);
  if (!path) {
    return;
  }
  const tracks = history
    .filter(isSavedTrack)
    .slice(0, HISTORY_LIMIT)
    .map(toSavedTrack);
  try {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    writeFileSync(path, `${JSON.stringify({ apiUrl, tracks }, null, 2)}\n`, {
      mode: 0o600,
    });
  } catch {
    // History is a convenience: a read-only config folder must not stop
    // playback.
  }
}
