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
import { sanitizePathSegment } from './hearthis-paths.mjs';
import {
  buildReleasePlan,
  fetchHearthisCatalog,
  releaseCreateBody,
} from './hearthis-release-meta.mjs';
import {
  downloadPendingRows,
  planRows,
  resolveKnownSounds,
  soundSummary,
  uploadBlocker,
  uploadPendingRows,
} from './hearthis-sounds.mjs';
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

function stopMessage(existing, plan) {
  return `You already have a release titled "${plan.title}" (${existing.id}). Pass --force-new to create another one, or --title to name this one differently.`;
}

/**
 * hearthis.at Set or track → Tahti release: downloads the original audio
 * with the Set downloader, uploads each file as a sound in Set order, then
 * creates a draft release from those sounds and sets the cover. A track
 * already in the upload ledger or the library is reused, not uploaded again.
 * A state file in `outDir` remembers the created release, so a rerun after a
 * failure only does what is left.
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
    ledgerPath = null,
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
  const fromState = new Map(
    Object.entries(state.sounds)
      .filter(([, entry]) => entry?.soundId)
      .map(([id, entry]) => [id, { soundId: entry.soundId, from: 'ledger' }]),
  );
  const result = {
    plan,
    statePath,
    ledgerPath: null,
    rows: planRows(plan.tracks, fromState, dryRun),
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

  const known = await resolveKnownSounds(config, plan.tracks, {
    outDir,
    ledgerPath,
    dryRun,
  });
  result.ledgerPath = known.ledger.path;
  const rows = planRows(plan.tracks, known.known, dryRun, known.conflicts);
  result.rows = rows;

  const duplicates = rows.filter((row) => row.status === 'possible duplicate');
  if (duplicates.length > 0) {
    result.stopped = `${duplicates.length} track(s) may already be in your library, so nothing was uploaded or created: ${duplicates.map((row) => `${String(row.position).padStart(2, '0')} ${row.reason}`).join('; ')}.`;
    return result;
  }

  const missing = rows.filter((row) => row.status === 'not downloadable');
  if (missing.length > 0) {
    result.stopped = `${missing.length} track(s) are not downloadable on hearthis.at (${missing.map((row) => row.position).join(', ')}). Leave them out with --tracks, or turn on downloads for them on hearthis.at.`;
    return result;
  }

  if (dryRun) {
    return result;
  }
  const blocker = uploadBlocker(rows, known);
  if (blocker) {
    result.stopped = blocker;
    return result;
  }

  const files = await downloadPendingRows(config, catalog, rows, {
    outDir,
    title: plan.title,
    flac,
    log,
  });
  await uploadPendingRows(config, rows, plan.tracks, files, {
    ledger: known.ledger,
    log,
    onUploaded: async (row, file) => {
      state.sounds[row.id] = { soundId: row.soundId, file };
      await writeReleaseState(statePath, plan.source, state);
    },
  });

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

export function soundCell(row) {
  if (row.soundId) {
    return row.matchedBy ? `${row.soundId} (${row.matchedBy})` : row.soundId;
  }
  return row.reason ?? '-';
}

export function formatReleaseRows(rows) {
  return formatTable(
    ['#', 'TITLE', 'DURATION', 'STATUS', 'SOUND / REASON'],
    rows.map((row) => [
      String(row.position).padStart(2, '0'),
      row.title,
      formatDuration(row.durationSec || null),
      row.status,
      soundCell(row),
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
    const counts = soundSummary(result.rows);
    parts.push(
      `Dry run: would upload ${counts.upload}, reuse ${counts.ledger} from the ledger and ${counts.library} from your library, then create the release. Nothing was downloaded, uploaded or created.\nLedger: ${result.ledgerPath}`,
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
