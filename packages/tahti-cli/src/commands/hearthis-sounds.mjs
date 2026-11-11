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

function normalizeTitle(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * A library sound that already holds this hearthis.at track's audio:
 * a sound exported to hearthis.at as this track (`hearthisExportId`), else an
 * uploaded (non-embed) sound with the same title and a length within
 * DURATION_TOLERANCE_SEC. Embeds are never reused: they play from
 * hearthis.at, not from Tahti.
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
  if (!title || !(track.durationSec > 0)) {
    return null;
  }
  const same = usable.find(
    (sound) =>
      !sound.embedProvider &&
      normalizeTitle(sound.title) === title &&
      sound.durationSec != null &&
      Math.abs(sound.durationSec - track.durationSec) <= DURATION_TOLERANCE_SEC,
  );
  return same ? { sound: same, matchedBy: 'title + duration' } : null;
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
  const libraryIds = new Set(library.sounds.map((sound) => sound.id));
  const known = new Map();
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
  return { ledger, known, dropped, migrated, library };
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

export function initialSoundStatus(track, known, dryRun) {
  const hit = known.get(track.id);
  if (hit) {
    return hit.from === 'library' ? 'in library' : 'uploaded before';
  }
  if (!track.downloadable) {
    return 'not downloadable';
  }
  return dryRun ? 'would upload' : 'pending';
}

export function planRows(tracks, known, dryRun) {
  return tracks.map((track) => ({
    id: track.id,
    position: track.position,
    title: track.title,
    durationSec: track.durationSec,
    status: initialSoundStatus(track, known, dryRun),
    soundId: known.get(track.id)?.soundId ?? null,
    matchedBy: known.get(track.id)?.matchedBy ?? null,
    reason: null,
  }));
}

export function soundSummary(rows) {
  const count = (status) => rows.filter((row) => row.status === status).length;
  return {
    upload: count('would upload') + count('pending') + count('uploaded'),
    ledger: count('uploaded before'),
    library: count('in library'),
    notDownloadable: count('not downloadable'),
  };
}
