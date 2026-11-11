import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import { apiGet, buildQuery, CliError } from '../api-client.mjs';
import { uploadSoundFile } from '../sound-upload.mjs';
import { downloadHearthisSet } from './hearthis-download-set.mjs';
import { soundMetadataFor } from './hearthis-release-meta.mjs';

export const LEDGER_FILENAME = '.tahti-hearthis-sounds.json';
const RELEASE_STATE_PATTERN = /^\.tahti-release-.+\.json$/;

/** GET /api/me/sound pages hold at most 100 sounds (`SOUND_LIST_MAX_LIMIT`). */
export const LIBRARY_PAGE_SIZE = 100;
const MAX_LIBRARY_PAGES = 500;

/** Tahti measures the uploaded audio itself, so its length can differ from
 * hearthis.at's by a second or two. */
export const DURATION_TOLERANCE_SEC = 2;
/** Uploads still processing after this long are treated as stuck. */
export const STUCK_AFTER_MS = 2 * 60 * 60 * 1000;

export function ledgerFilePath(outDir, override = null) {
  return resolve(override ?? join(resolve(outDir), LEDGER_FILENAME));
}

export async function readLedger(path) {
  try {
    const body = JSON.parse(await readFile(path, 'utf8'));
    const sounds =
      body.sounds && typeof body.sounds === 'object' ? body.sounds : {};
    return { path, sounds };
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return { path, sounds: {} };
    }
    throw new CliError(
      `Could not read the upload ledger ${path}: ${error?.message ?? error}`,
    );
  }
}

/** Written to a temp file then renamed, so an interrupted run never leaves a
 * half-written ledger that would forget finished uploads. */
export async function writeLedger(ledger) {
  await mkdir(dirname(ledger.path), { recursive: true });
  const body = {
    sounds: ledger.sounds,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(`${ledger.path}.tmp`, `${JSON.stringify(body, null, 2)}\n`);
  await rename(`${ledger.path}.tmp`, ledger.path);
}

export function rememberSound(ledger, track, soundId, from) {
  ledger.sounds[track.id] = {
    soundId,
    title: track.title,
    url: track.url ?? null,
    from,
    at: new Date().toISOString(),
  };
}

/** Copies the sound ids that `hearthis release` kept per Set
 * (`<out>/.tahti-release-<permalink>.json`) into the ledger. Answers how many
 * were new to it. */
export async function importReleaseStates(outDir, ledger) {
  let names;
  try {
    names = await readdir(resolve(outDir));
  } catch {
    return 0;
  }
  let added = 0;
  for (const name of names.filter((entry) =>
    RELEASE_STATE_PATTERN.test(entry),
  )) {
    let state;
    try {
      state = JSON.parse(await readFile(join(resolve(outDir), name), 'utf8'));
    } catch {
      continue;
    }
    for (const [trackId, entry] of Object.entries(state?.sounds ?? {})) {
      if (entry?.soundId && !ledger.sounds[trackId]) {
        ledger.sounds[trackId] = {
          soundId: entry.soundId,
          title: null,
          url: null,
          from: 'release state',
          at: state.updatedAt ?? null,
        };
        added += 1;
      }
    }
  }
  return added;
}

/** Every sound in the signed-in artist's library, paged. `complete` is false
 * when the page cap stopped the walk early. */
export async function fetchLibrary(
  config,
  { pageSize = LIBRARY_PAGE_SIZE } = {},
) {
  const sounds = [];
  for (let page = 0; page < MAX_LIBRARY_PAGES; page += 1) {
    const result = await apiGet(
      `/api/me/sound${buildQuery({ limit: pageSize, offset: page * pageSize })}`,
      config,
    );
    const items = Array.isArray(result) ? result : (result.items ?? []);
    sounds.push(...items);
    const total = Array.isArray(result) ? items.length : result.total;
    if (items.length < pageSize || sounds.length >= total) {
      return { sounds, complete: true };
    }
  }
  return { sounds, complete: false };
}

/** Title compared case- and spacing-insensitively. */
export function sameTitleKey(value) {
  return normalizeTitle(value);
}

function normalizeTitle(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeUrl(value) {
  return String(value ?? '')
    .trim()
    .replace(/^https?:\/\/(www\.)?/i, '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '')
    .toLowerCase();
}

function isHearthisEmbedOf(sound, track) {
  if (!sound.embedProvider) {
    return false;
  }
  const trackUrl = normalizeUrl(track.url);
  if (trackUrl && normalizeUrl(sound.embedSourceUrl) === trackUrl) {
    return true;
  }
  const uri = String(sound.embedUri ?? '');
  return Boolean(track.id) && new RegExp(`(^|\\D)${track.id}(\\D|$)`).test(uri);
}

function closeEnough(sound, track) {
  return (
    sound.durationSec != null &&
    track.durationSec > 0 &&
    Math.abs(sound.durationSec - track.durationSec) <= DURATION_TOLERANCE_SEC
  );
}

const READY_FIRST = (a, b) =>
  Number(b.status === 'READY') - Number(a.status === 'READY') ||
  String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? ''));

/**
 * Whether the library already holds this hearthis.at track. Answers
 * `{ sound, matchedBy }` for a sound to reuse, `{ conflict, sound }` when
 * something that may be the same track exists but cannot be reused safely
 * (a hearthis.at embed, or the same title with a different length), and
 * null only when nothing in the library looks like this track, which is the
 * only case where uploading cannot make a duplicate.
 *
 * A sound still processing has no length yet, so a title match counts for
 * it. Sounds that failed processing are ignored.
 */
export function findLibraryMatch(track, sounds) {
  const usable = sounds.filter((sound) => sound.status !== 'ERROR');
  const exported = usable.find(
    (sound) =>
      sound.hearthisExportId && String(sound.hearthisExportId) === track.id,
  );
  if (exported) {
    return { sound: exported, matchedBy: 'hearthis export id' };
  }
  const title = normalizeTitle(track.title);
  const embed = usable.find(
    (sound) =>
      isHearthisEmbedOf(sound, track) ||
      (sound.embedProvider && title && normalizeTitle(sound.title) === title),
  );
  if (embed) {
    return {
      conflict: `a hearthis.at embed of this track is in your library (${embed.id}); convert it with \`tahti hearthis import-embeds\` first`,
      sound: embed,
    };
  }
  if (!title) {
    return null;
  }
  const sameTitle = usable
    .filter(
      (sound) => !sound.embedProvider && normalizeTitle(sound.title) === title,
    )
    .sort(READY_FIRST);
  const timed = sameTitle.find((sound) => closeEnough(sound, track));
  if (timed) {
    return { sound: timed, matchedBy: 'title + duration' };
  }
  const untimed = sameTitle.find((sound) => sound.durationSec == null);
  if (untimed) {
    return { sound: untimed, matchedBy: 'title (still processing)' };
  }
  if (sameTitle.length > 0) {
    return {
      conflict: `a sound with the same title but a different length is in your library (${sameTitle[0].id})`,
      sound: sameTitle[0],
    };
  }
  return null;
}

/**
 * Which planned tracks already have a Tahti sound: the ledger first, then the
 * library. Ledger entries whose sound is gone from a fully read library are
 * dropped so the track uploads again. Library matches are written into the
 * ledger unless `dryRun`.
 */
export async function resolveKnownSounds(
  config,
  tracks,
  { outDir, ledgerPath = null, dryRun = false },
) {
  const ledger = await readLedger(ledgerFilePath(outDir, ledgerPath));
  const migrated = await importReleaseStates(outDir, ledger);
  const library = await fetchLibrary(config);
  if (!library.complete) {
    throw new CliError(
      'Your library has more sounds than the CLI can read in one go, so it cannot check every track for an existing copy. Stopping before anything is uploaded.',
    );
  }
  const libraryIds = new Set(library.sounds.map((sound) => sound.id));
  const known = new Map();
  const conflicts = new Map();
  const dropped = [];
  for (const track of tracks) {
    const entry = ledger.sounds[track.id];
    if (entry?.soundId) {
      if (!library.complete || libraryIds.has(entry.soundId)) {
        known.set(track.id, { soundId: entry.soundId, from: 'ledger' });
        continue;
      }
      dropped.push({ trackId: track.id, soundId: entry.soundId });
      delete ledger.sounds[track.id];
    }
    const match = findLibraryMatch(track, library.sounds);
    if (match?.conflict) {
      conflicts.set(track.id, {
        soundId: match.sound.id,
        reason: match.conflict,
      });
      continue;
    }
    if (match) {
      known.set(track.id, {
        soundId: match.sound.id,
        from: 'library',
        matchedBy: match.matchedBy,
      });
      rememberSound(
        ledger,
        track,
        match.sound.id,
        `library (${match.matchedBy})`,
      );
    }
  }
  const changed =
    migrated > 0 ||
    dropped.length > 0 ||
    [...known.values()].some((entry) => entry.from === 'library');
  if (changed && !dryRun) {
    await writeLedger(ledger);
  }
  const now = Date.now();
  const stuck = library.sounds.filter(
    (sound) =>
      !sound.embedProvider &&
      (sound.status === 'PENDING' || sound.status === 'PROCESSING') &&
      now - Date.parse(sound.createdAt ?? '') > STUCK_AFTER_MS,
  );
  return { ledger, known, conflicts, stuck, dropped, migrated, library };
}

/**
 * Downloads the rows marked `pending` with the Set downloader (owner-only
 * numbering, so row positions line up) and answers a Map of track id → file.
 * Rows that did not download get `status: 'failed'` and the reason.
 */
export async function downloadPendingRows(
  config,
  catalog,
  rows,
  { outDir, title, flac = false, log = () => {} },
) {
  const pending = rows.filter((row) => row.status === 'pending');
  const files = new Map();
  if (pending.length === 0) {
    return files;
  }
  log(`Downloading ${pending.length} file(s) from hearthis.at…`);
  const download = await downloadHearthisSet(config, catalog.url, {
    catalog,
    outDir,
    ownOnly: true,
    title,
    artwork: false,
    flac,
    writeManifest: false,
    tracks: pending.map((row) => row.position).join(','),
    onProgress: (row) =>
      log(
        `  ${String(row.position).padStart(2, '0')} ${row.title}: ${row.status}`,
      ),
  });
  for (const entry of download.rows) {
    if (
      entry.path &&
      (entry.status === 'downloaded' || entry.status === 'skipped')
    ) {
      files.set(entry.id, join(download.outDir, entry.path));
    }
  }
  for (const row of pending) {
    if (!files.has(row.id)) {
      row.status = 'failed';
      row.reason =
        download.rows.find((entry) => entry.id === row.id)?.reason ??
        'download failed';
    }
  }
  return files;
}

/** Uploads each `pending` row's file in order and records it in the ledger
 * right away, so a later failure never loses a finished upload. */
export async function uploadPendingRows(
  config,
  rows,
  tracks,
  files,
  { ledger, log = () => {}, onUploaded = async () => {} },
) {
  for (const row of rows) {
    if (row.status !== 'pending') {
      continue;
    }
    const track = tracks.find((entry) => entry.id === row.id);
    log(`Uploading ${String(row.position).padStart(2, '0')} ${row.title}…`);
    try {
      const soundId = await uploadSoundFile(config, files.get(row.id), {
        title: row.title,
        metadata: soundMetadataFor(track),
      });
      if (!soundId) {
        throw new CliError('the API answered without a sound id');
      }
      row.soundId = soundId;
      row.status = 'uploaded';
      rememberSound(ledger, track, soundId, 'upload');
      await writeLedger(ledger);
      await onUploaded(row, files.get(row.id));
    } catch (error) {
      row.status = 'failed';
      row.reason = error?.message ?? String(error);
    }
  }
}

export function initialSoundStatus(track, known, dryRun, conflicts) {
  if (conflicts?.has(track.id)) {
    return 'possible duplicate';
  }
  const hit = known.get(track.id);
  if (hit) {
    return hit.from === 'library' ? 'in library' : 'uploaded before';
  }
  if (!track.downloadable) {
    return 'not downloadable';
  }
  return dryRun ? 'would upload' : 'pending';
}

export function planRows(tracks, known, dryRun, conflicts = new Map()) {
  return tracks.map((track) => ({
    id: track.id,
    position: track.position,
    title: track.title,
    durationSec: track.durationSec,
    status: initialSoundStatus(track, known, dryRun, conflicts),
    soundId: known.get(track.id)?.soundId ?? null,
    matchedBy: known.get(track.id)?.matchedBy ?? null,
    reason: conflicts.get(track.id)?.reason ?? null,
  }));
}

export function soundSummary(rows) {
  const count = (status) => rows.filter((row) => row.status === status).length;
  return {
    upload: count('would upload') + count('pending') + count('uploaded'),
    ledger: count('uploaded before'),
    library: count('in library'),
    notDownloadable: count('not downloadable'),
    possibleDuplicate: count('possible duplicate'),
  };
}

/** Why a run must not upload yet, or null. Uploading while earlier uploads
 * sit unprocessed only adds more sounds nobody can play. */
export function uploadBlocker(rows, known) {
  const uploads = rows.filter((row) => row.status === 'pending').length;
  if (uploads === 0 || known.stuck.length === 0) {
    return null;
  }
  return `${known.stuck.length} earlier upload(s) are still processing after more than ${STUCK_AFTER_MS / 3600000} hours (oldest: ${known.stuck[0].title}, ${known.stuck[0].id}). Nothing new is uploaded until they finish or are deleted; check \`tahti library processing\`.`;
}
