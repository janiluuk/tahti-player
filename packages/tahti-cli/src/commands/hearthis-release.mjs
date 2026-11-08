import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import {
  apiGet,
  apiSendJson,
  buildQuery,
  CliError,
  requireToken,
} from '../api-client.mjs';
import { formatDuration, formatTable } from '../format.mjs';
import { uploadSoundFile } from '../sound-upload.mjs';
import { downloadHearthisSet } from './hearthis-download-set.mjs';
import { sanitizePathSegment } from './hearthis-paths.mjs';
import {
  buildReleasePlan,
  fetchHearthisCatalog,
  releaseCreateBody,
  soundMetadataFor,
} from './hearthis-release-meta.mjs';
import { parseReleaseDate, tracksFromSounds } from './releases-create.mjs';
import { MAX_RELEASES_LIMIT } from './releases-list.mjs';

const MAX_RELEASE_PAGES = 50;

export function stateFilePath(outDir, permalink) {
  return join(
    resolve(outDir),
    `.tahti-release-${sanitizePathSegment(permalink, 'hearthis').replace(/\s+/g, '-')}.json`,
  );
}

export async function readReleaseState(path) {
  try {
    const state = JSON.parse(await readFile(path, 'utf8'));
    return {
      releaseId: typeof state.releaseId === 'string' ? state.releaseId : null,
      sounds:
        state.sounds && typeof state.sounds === 'object' ? state.sounds : {},
    };
  } catch {
    return { releaseId: null, sounds: {} };
  }
}

/** Written to a temp file then renamed, so an interrupted run never leaves a
 * half-written state file that would forget finished uploads. */
async function writeReleaseState(path, source, state) {
  await mkdir(dirname(path), { recursive: true });
  const body = {
    source,
    releaseId: state.releaseId,
    sounds: state.sounds,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(`${path}.tmp`, `${JSON.stringify(body, null, 2)}\n`);
  await rename(`${path}.tmp`, path);
}

export async function findReleaseByTitle(config, title) {
  const wanted = title.trim().toLowerCase();
  for (let page = 1; page <= MAX_RELEASE_PAGES; page += 1) {
    const result = await apiGet(
      `/api/me/releases${buildQuery({ page, limit: MAX_RELEASES_LIMIT })}`,
      config,
    );
    const releases = result.releases ?? [];
    const match = releases.find(
      (release) => String(release.title).trim().toLowerCase() === wanted,
    );
    if (match) {
      return match;
    }
    if (releases.length === 0 || page * MAX_RELEASES_LIMIT >= result.total) {
      return null;
    }
  }
  return null;
}

/** tahti.live for api.tahti.live; `TAHTI_WEB_URL` overrides it for other hosts. */
export function webBaseUrl(config) {
  const override = config.env?.TAHTI_WEB_URL;
  if (override) {
    return override.replace(/\/$/, '');
  }
  const match = /^(https?:\/\/)api\.(.+)$/.exec(config.apiUrl ?? '');
  return match ? `${match[1]}${match[2]}` : null;
}

export function releaseUrl(config, releaseId) {
  const base = webBaseUrl(config);
  return base
    ? `${base}/studio/releases/${encodeURIComponent(releaseId)}`
    : null;
}

function trackStatus(track, state, dryRun) {
  if (state.sounds[track.id]?.soundId) {
    return 'uploaded before';
  }
  if (!track.downloadable) {
    return 'not downloadable';
  }
  return dryRun ? 'would upload' : 'pending';
}

function stopMessage(existing, plan) {
  return `You already have a release titled "${plan.title}" (${existing.id}). Pass --force-new to create another one, or --title to name this one differently.`;
}

/**
 * hearthis.at Set or track → Tahti release: downloads the original audio
 * with the Set downloader, uploads each file as a sound in Set order, then
 * creates a draft release from those sounds and sets the cover. A state file
 * in `outDir` remembers uploaded sounds and the created release, so a rerun
 * after a failure only does what is left.
 */
export async function hearthisToRelease(
  config,
  input,
  {
    outDir = '.',
    dryRun = false,
    forceNew = false,
    title = null,
    type = null,
    date = null,
    tracks = null,
    flac = false,
    log = () => {},
  } = {},
) {
  requireToken(config);
  const catalog = await fetchHearthisCatalog(config, input);
  const plan = buildReleasePlan(catalog, {
    title,
    type,
    date: date ? parseReleaseDate(date) : null,
    tracks,
  });
  const statePath = stateFilePath(outDir, plan.permalink);
  const state = await readReleaseState(statePath);
  const rows = plan.tracks.map((track) => ({
    id: track.id,
    position: track.position,
    title: track.title,
    durationSec: track.durationSec,
    status: trackStatus(track, state, dryRun),
    soundId: state.sounds[track.id]?.soundId ?? null,
    reason: null,
  }));
  const result = {
    plan,
    statePath,
    rows,
    existingRelease: null,
    release: null,
    releaseUrl: null,
    cover: null,
    stopped: null,
  };

  if (state.releaseId) {
    result.release = { id: state.releaseId };
    result.releaseUrl = releaseUrl(config, state.releaseId);
    result.stopped = 'already created';
    return result;
  }

  if (!forceNew) {
    result.existingRelease = await findReleaseByTitle(config, plan.title);
    if (result.existingRelease) {
      result.stopped = stopMessage(result.existingRelease, plan);
      return result;
    }
  }

  const missing = rows.filter((row) => row.status === 'not downloadable');
  if (missing.length > 0) {
    result.stopped = `${missing.length} track(s) are not downloadable on hearthis.at (${missing.map((row) => row.position).join(', ')}). Leave them out with --tracks, or turn on downloads for them on hearthis.at.`;
    return result;
  }

  if (dryRun) {
    return result;
  }

  const toDownload = rows.filter((row) => row.status === 'pending');
  const files = new Map();
  if (toDownload.length > 0) {
    log(`Downloading ${toDownload.length} file(s) from hearthis.at…`);
    const download = await downloadHearthisSet(config, plan.source, {
      catalog,
      outDir,
      ownOnly: true,
      title: plan.title,
      artwork: false,
      flac,
      writeManifest: false,
      tracks: toDownload.map((row) => row.position).join(','),
      onProgress: (row) =>
        log(
          `  ${String(row.position).padStart(2, '0')} ${row.title}: ${row.status}`,
        ),
    });
    for (const row of download.rows) {
      if (
        row.path &&
        (row.status === 'downloaded' || row.status === 'skipped')
      ) {
        files.set(row.id, join(download.outDir, row.path));
      }
    }
    for (const row of toDownload) {
      const downloaded = download.rows.find((entry) => entry.id === row.id);
      if (!files.has(row.id)) {
        row.status = 'failed';
        row.reason = downloaded?.reason ?? 'download failed';
      }
    }
  }

  for (const row of rows) {
    if (row.status !== 'pending') {
      continue;
    }
    const track = plan.tracks.find((entry) => entry.id === row.id);
    log(`Uploading ${String(row.position).padStart(2, '0')} ${row.title}…`);
    try {
      row.soundId = await uploadSoundFile(config, files.get(row.id), {
        title: row.title,
        metadata: soundMetadataFor(track),
      });
      if (!row.soundId) {
        throw new CliError('the API answered without a sound id');
      }
      row.status = 'uploaded';
      state.sounds[row.id] = { soundId: row.soundId, file: files.get(row.id) };
      await writeReleaseState(statePath, plan.source, state);
    } catch (error) {
      row.status = 'failed';
      row.reason = error?.message ?? String(error);
    }
  }

  const failed = rows.filter((row) => row.status === 'failed');
  if (failed.length > 0) {
    result.stopped = `${failed.length} track(s) failed, so no release was created. Run the same command again to retry them; uploaded tracks are kept.`;
    return result;
  }

  const releaseTracks = await tracksFromSounds(
    config,
    rows.map((row) => row.soundId),
  );
  releaseTracks.forEach((releaseTrack, index) => {
    if (!releaseTrack.durationSec && rows[index].durationSec > 0) {
      releaseTrack.durationSec = rows[index].durationSec;
    }
  });
  const release = await apiSendJson(
    'POST',
    '/api/me/releases',
    { ...releaseCreateBody(plan), tracks: releaseTracks },
    config,
  );
  state.releaseId = release.id;
  await writeReleaseState(statePath, plan.source, state);
  result.release = release;
  result.releaseUrl = releaseUrl(config, release.id);

  if (plan.coverUrl) {
    try {
      await apiSendJson(
        'POST',
        `/api/me/releases/${encodeURIComponent(release.id)}/artwork/from-url`,
        { sourceUrl: plan.coverUrl },
        config,
      );
      result.cover = { status: 'set', url: plan.coverUrl };
    } catch (error) {
      result.cover = {
        status: 'failed',
        url: plan.coverUrl,
        reason: error?.message ?? String(error),
      };
    }
  }
  return result;
}

export function formatReleasePlanHeader(plan) {
  const lines = [
    `${plan.title} (${plan.type.toLowerCase()}, ${plan.releaseDate}) from ${plan.source}`,
  ];
  if (plan.genre) {
    lines.push(`Genre: ${plan.genre}`);
  }
  if (plan.coverUrl) {
    lines.push(`Cover: ${plan.coverUrl}`);
  }
  if (plan.description) {
    const firstLine = plan.description.split('\n')[0];
    lines.push(
      `Description: ${firstLine}${plan.description.includes('\n') ? ' …' : ''}`,
    );
  }
  if (plan.excludedOthers > 0) {
    lines.push(
      `Left out: ${plan.excludedOthers} track(s) uploaded by other hearthis.at accounts.`,
    );
  }
  return lines.join('\n');
}

export function formatReleaseRows(rows) {
  return formatTable(
    ['#', 'TITLE', 'DURATION', 'STATUS', 'SOUND / REASON'],
    rows.map((row) => [
      String(row.position).padStart(2, '0'),
      row.title,
      formatDuration(row.durationSec || null),
      row.status,
      row.soundId ?? row.reason ?? '-',
    ]),
  );
}

export async function runHearthisRelease(config, input, options = {}) {
  if (!input) {
    throw new CliError(
      'Missing hearthis.at Set or track URL.\nRun `tahti hearthis release --help` for usage.',
    );
  }
  const json = Boolean(options.json);
  const result = await hearthisToRelease(config, input, {
    ...options,
    log: json
      ? () => {}
      : (options.log ?? ((line) => process.stderr.write(`${line}\n`))),
  });
  const alreadyCreated = result.stopped === 'already created';
  const exitCode = result.stopped && !alreadyCreated ? 1 : 0;
  if (json) {
    return { output: JSON.stringify(result, null, 2), exitCode };
  }
  const parts = [
    formatReleasePlanHeader(result.plan),
    formatReleaseRows(result.rows),
  ];
  if (alreadyCreated) {
    parts.push(
      `This release was already created (${result.release.id}); ${result.releaseUrl ?? 'open it in Studio → Releases'}.\nDelete ${result.statePath} to start over.`,
    );
  } else if (result.stopped) {
    parts.push(`Stopped: ${result.stopped}`);
  } else if (options.dryRun) {
    parts.push(
      `Dry run: nothing was downloaded, uploaded or created. Progress is kept in ${result.statePath}.`,
    );
  } else {
    const cover =
      result.cover?.status === 'failed'
        ? `\nCover not set (${result.cover.reason}); add it in Studio.`
        : '';
    parts.push(
      `Created draft release "${result.release.title}" (${result.release.id}).${cover}\n${result.releaseUrl ?? 'Open it in Studio → Releases.'}`,
    );
  }
  return { output: parts.join('\n\n'), exitCode };
}
