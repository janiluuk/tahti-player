import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import {
  apiGet,
  apiPost,
  CliError,
  parsePositiveInt,
  requireToken,
} from '../api-client.mjs';
import { formatDuration, formatTable } from '../format.mjs';
import {
  collectionCreateBody,
  createCollection,
  MAX_COLLECTION_DESCRIPTION,
  MAX_COLLECTION_NAME,
  parseCollectionType,
  parseCollectionVisibility,
} from './collections-create.mjs';
import { fetchCollections } from './collections-list.mjs';
import { largestCover } from './hearthis-download-set.mjs';
import { sanitizePathSegment } from './hearthis-paths.mjs';
import {
  fetchHearthisCatalog,
  selectOwnTracks,
} from './hearthis-release-meta.mjs';
import { soundCell, webBaseUrl } from './hearthis-release.mjs';
import {
  downloadPendingRows,
  planRows,
  resolveKnownSounds,
  soundSummary,
  uploadPendingRows,
} from './hearthis-sounds.mjs';

export const DEFAULT_PROCESSING_WAIT_SEC = 600;
const POLL_MS = 5000;

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

export function collectionStatePath(outDir, permalink) {
  return join(
    resolve(outDir),
    `.tahti-collection-${sanitizePathSegment(permalink, 'hearthis').replace(/\s+/g, '-')}.json`,
  );
}

export async function readCollectionState(path) {
  try {
    const state = JSON.parse(await readFile(path, 'utf8'));
    return { slug: typeof state.slug === 'string' ? state.slug : null };
  } catch {
    return { slug: null };
  }
}

async function writeCollectionState(path, source, slug) {
  await mkdir(dirname(path), { recursive: true });
  const body = { source, slug, updatedAt: new Date().toISOString() };
  await writeFile(`${path}.tmp`, `${JSON.stringify(body, null, 2)}\n`);
  await rename(`${path}.tmp`, path);
}

export function collectionUrl(config, slug) {
  const base = webBaseUrl(config);
  return base ? `${base}/studio/collections/${encodeURIComponent(slug)}` : null;
}

export function buildCollectionPlan(
  catalog,
  { name = null, type = null, visibility = null, tracks = null } = {},
) {
  if (catalog.kind !== 'set') {
    throw new CliError(
      'A collection is made from a hearthis.at Set (https://hearthis.at/set/<permalink>/), not a single track.',
    );
  }
  const { owner, own, planned, excludedOthers } = selectOwnTracks(
    catalog,
    tracks,
    'Set',
  );
  const collectionName = (name || catalog.set?.title || catalog.permalink)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_COLLECTION_NAME);
  const description = (catalog.set?.description ?? '')
    .trim()
    .slice(0, MAX_COLLECTION_DESCRIPTION);
  return {
    source: catalog.url,
    permalink: catalog.permalink,
    owner,
    name: collectionName,
    type,
    visibility,
    description: description || null,
    coverUrl: largestCover(
      catalog.set?.coverUrl ??
        own.find((track) => track.coverUrl)?.coverUrl ??
        null,
    ),
    excludedOthers,
    tracks: planned,
  };
}

async function fetchOwnCollection(config, slug) {
  try {
    return await apiGet(
      `/api/me/collections/${encodeURIComponent(slug)}`,
      config,
    );
  } catch (error) {
    if (
      error instanceof CliError &&
      /not found|HTTP 404/i.test(error.message)
    ) {
      return null;
    }
    throw error;
  }
}

/**
 * Which collection the run fills: the one in the state file, else `--slug`
 * when you already have it, else none yet. A collection of yours with the
 * same name and no state file stops the run, so a lost state file never
 * leads to a second copy.
 */
async function findTargetCollection(config, plan, state, slug) {
  if (state.slug) {
    const existing = await fetchOwnCollection(config, state.slug);
    if (!existing) {
      return {
        stopped: `The state file names collection "${state.slug}", which you no longer have. Delete the state file to create it again.`,
      };
    }
    return { collection: existing };
  }
  if (slug) {
    const existing = await fetchOwnCollection(config, slug);
    return existing ? { collection: existing } : {};
  }
  const wanted = plan.name.toLowerCase();
  const sameName = (await fetchCollections(config)).find(
    (collection) => String(collection.name).trim().toLowerCase() === wanted,
  );
  if (sameName) {
    return {
      stopped: `You already have a collection named "${sameName.name}" (${sameName.slug}). Pass --slug ${sameName.slug} to fill that one, or --name to create another.`,
    };
  }
  return {};
}

async function waitForProcessing(config, soundIds, waitSec, log) {
  if (soundIds.length === 0 || waitSec <= 0) {
    return;
  }
  const wanted = new Set(soundIds);
  const deadline = Date.now() + waitSec * 1000;
  let announced = false;
  for (;;) {
    const { processing = [] } = await apiGet(
      '/api/me/sound/processing',
      config,
    );
    const busy = processing.filter((sound) => wanted.has(sound.id));
    if (busy.length === 0 || Date.now() >= deadline) {
      return;
    }
    if (!announced) {
      log(`Waiting for ${busy.length} track(s) to finish processing…`);
      announced = true;
    }
    await sleep(POLL_MS);
  }
}

/**
 * Adds every row's sound in Set order. A sound already in the collection
 * stays where it is; a missing one goes right after the previous Set track
 * that is there, so a rerun fills gaps without reordering anything.
 */
async function addInSetOrder(config, slug, rows, items) {
  const positions = new Map(
    items
      .filter((item) => item.soundId ?? item.sound?.id)
      .map((item) => [item.soundId ?? item.sound.id, item.position]),
  );
  let previous = 0;
  for (const row of rows) {
    if (!row.soundId) {
      continue;
    }
    if (positions.has(row.soundId)) {
      row.item = 'in collection';
      previous = positions.get(row.soundId);
      continue;
    }
    const position = previous + 1;
    try {
      await apiPost(
        `/api/me/collections/${encodeURIComponent(slug)}/items`,
        { soundId: row.soundId, position },
        config,
      );
    } catch (error) {
      if (!(error instanceof CliError)) {
        throw error;
      }
      if (/still processing/i.test(error.message)) {
        row.item = 'processing';
      } else if (/Already in this playlist/.test(error.message)) {
        row.item = 'in collection';
      } else {
        row.item = 'failed';
        row.reason = error.message;
      }
      continue;
    }
    for (const [soundId, at] of positions) {
      if (at >= position) {
        positions.set(soundId, at + 1);
      }
    }
    positions.set(row.soundId, position);
    previous = position;
    row.item = 'added';
  }
}

/**
 * hearthis.at Set → Tahti collection. Tracks already in the upload ledger
 * or the library are reused; the rest are downloaded and uploaded. The
 * collection is created once (its slug is kept in a state file in `outDir`)
 * and each sound is added in Set order. Tracks that cannot be downloaded or
 * uploaded are skipped and listed, unless `strict`.
 */
export async function hearthisToCollection(
  config,
  input,
  {
    outDir = '.',
    ledgerPath = null,
    dryRun = false,
    strict = false,
    name = null,
    slug = null,
    type = null,
    visibility = null,
    private: isPrivate = false,
    tracks = null,
    flac = false,
    waitSec = DEFAULT_PROCESSING_WAIT_SEC,
    log = () => {},
  } = {},
) {
  requireToken(config);
  const catalog = await fetchHearthisCatalog(config, input);
  const plan = buildCollectionPlan(catalog, {
    name,
    type: parseCollectionType(type),
    visibility: parseCollectionVisibility({ visibility, private: isPrivate }),
    tracks,
  });
  const statePath = collectionStatePath(outDir, plan.permalink);
  const state = await readCollectionState(statePath);
  const result = {
    plan,
    statePath,
    ledgerPath: null,
    rows: [],
    collection: null,
    collectionUrl: null,
    created: false,
    cover: null,
    stopped: null,
  };

  const target = await findTargetCollection(config, plan, state, slug);
  if (target.stopped) {
    result.stopped = target.stopped;
    return result;
  }
  result.collection = target.collection ?? null;

  const known = await resolveKnownSounds(config, plan.tracks, {
    outDir,
    ledgerPath,
    dryRun,
  });
  result.ledgerPath = known.ledger.path;
  const rows = planRows(plan.tracks, known.known, dryRun).map((row) => ({
    ...row,
    item: null,
  }));
  result.rows = rows;
  const present = new Set(
    (result.collection?.items ?? []).map(
      (item) => item.soundId ?? item.sound?.id,
    ),
  );
  for (const row of rows) {
    if (row.status === 'not downloadable') {
      row.item = 'skipped';
      row.reason = 'not downloadable on hearthis.at';
    } else if (row.soundId && present.has(row.soundId)) {
      row.item = 'in collection';
    } else if (dryRun) {
      row.item = 'would add';
    }
  }

  const skipped = rows.filter((row) => row.status === 'not downloadable');
  if (strict && skipped.length > 0) {
    result.stopped = `${skipped.length} track(s) are not downloadable on hearthis.at (${skipped.map((row) => row.position).join(', ')}). Leave them out with --tracks, turn on downloads for them on hearthis.at, or drop --strict to skip them.`;
    return result;
  }
  if (dryRun) {
    return result;
  }

  const files = await downloadPendingRows(config, catalog, rows, {
    outDir,
    title: plan.name,
    flac,
    log,
  });
  await uploadPendingRows(config, rows, plan.tracks, files, {
    ledger: known.ledger,
    log,
  });
  for (const row of rows) {
    if (row.status === 'failed') {
      row.item = 'skipped';
    }
  }
  if (strict && rows.some((row) => row.status === 'failed')) {
    result.stopped =
      'Some tracks failed to download or upload, so the collection was not changed. Run the same command again to retry them; uploaded tracks are kept.';
    return result;
  }

  if (!result.collection) {
    const body = collectionCreateBody({
      name: plan.name,
      slug,
      type: plan.type,
      description: plan.description,
      visibility: plan.visibility,
    });
    const created = await createCollection(config, body, {
      coverUrl: plan.coverUrl,
    });
    await writeCollectionState(statePath, plan.source, created.collection.slug);
    result.collection = { ...created.collection, items: [] };
    result.created = true;
    result.cover = created.cover;
  } else if (!state.slug) {
    await writeCollectionState(statePath, plan.source, result.collection.slug);
  }
  result.collectionUrl = collectionUrl(config, result.collection.slug);

  const toAdd = rows.filter(
    (row) => row.soundId && row.item !== 'in collection',
  );
  await waitForProcessing(
    config,
    toAdd.map((row) => row.soundId),
    waitSec,
    log,
  );
  await addInSetOrder(
    config,
    result.collection.slug,
    rows,
    result.collection.items ?? [],
  );
  return result;
}

export function formatCollectionRows(rows) {
  return formatTable(
    ['#', 'TITLE', 'DURATION', 'SOUND', 'COLLECTION', 'SOUND / REASON'],
    rows.map((row) => [
      String(row.position).padStart(2, '0'),
      row.title,
      formatDuration(row.durationSec || null),
      row.status,
      row.item ?? '-',
      soundCell(row),
    ]),
  );
}

function planHeader(result) {
  const { plan } = result;
  const lines = [`${plan.name} from ${plan.source}`];
  if (result.collection) {
    lines.push(`Collection: ${result.collection.slug} (exists)`);
  } else {
    const details = [
      (plan.type ?? 'CUSTOM').toLowerCase(),
      (plan.visibility ?? 'PUBLIC').toLowerCase(),
    ];
    lines.push(`Collection: new (${details.join(', ')})`);
  }
  if (plan.coverUrl && !result.collection) {
    lines.push(`Cover: ${plan.coverUrl}`);
  }
  if (plan.excludedOthers > 0) {
    lines.push(
      `Left out: ${plan.excludedOthers} track(s) uploaded by other hearthis.at accounts.`,
    );
  }
  return lines.join('\n');
}

function summaryLine(result, dryRun) {
  const counts = soundSummary(result.rows);
  const items = (state) =>
    result.rows.filter((row) => row.item === state).length;
  if (dryRun) {
    const create = result.collection ? '' : 'create the collection, ';
    return `Dry run: would upload ${counts.upload}, reuse ${counts.ledger} from the ledger and ${counts.library} from your library, ${create}add ${items('would add')} and skip ${items('skipped')}. Nothing was downloaded, uploaded or created.\nLedger: ${result.ledgerPath}`;
  }
  const lines = [
    `${result.created ? 'Created' : 'Updated'} collection "${result.collection.name}" (${result.collection.slug}): added ${items('added')}, ${items('in collection')} already there.`,
  ];
  if (result.collectionUrl) {
    lines.push(result.collectionUrl);
  }
  if (result.cover?.status === 'failed') {
    lines.push(`Cover not set (${result.cover.reason}); add it in Studio.`);
  }
  const skipped = result.rows.filter((row) => row.item === 'skipped');
  if (skipped.length > 0) {
    lines.push(
      `Skipped ${skipped.length}: ${skipped.map((row) => `#${row.position} (${row.reason})`).join(', ')}.`,
    );
  }
  const processing = items('processing');
  if (processing > 0) {
    lines.push(
      `${processing} track(s) are still processing; run the same command again later to add them.`,
    );
  }
  const failed = result.rows.filter((row) => row.item === 'failed');
  if (failed.length > 0) {
    lines.push(`${failed.length} track(s) could not be added; see the table.`);
  }
  return lines.join('\n');
}

export async function runHearthisCollection(config, input, options = {}) {
  if (!input) {
    throw new CliError(
      'Missing hearthis.at Set URL or permalink.\nRun `tahti hearthis collection --help` for usage.',
    );
  }
  const json = Boolean(options.json);
  const waitSec =
    options.wait === undefined || options.wait === null
      ? DEFAULT_PROCESSING_WAIT_SEC
      : options.wait === '0' || options.wait === 0
        ? 0
        : parsePositiveInt('--wait', options.wait);
  const result = await hearthisToCollection(config, input, {
    ...options,
    waitSec,
    log: json
      ? () => {}
      : (options.log ?? ((line) => process.stderr.write(`${line}\n`))),
  });
  const incomplete = result.rows.some((row) =>
    ['skipped', 'processing', 'failed'].includes(row.item),
  );
  const exitCode = result.stopped || (!options.dryRun && incomplete) ? 1 : 0;
  if (json) {
    return { output: JSON.stringify(result, null, 2), exitCode };
  }
  const parts = [planHeader(result)];
  if (result.rows.length > 0) {
    parts.push(formatCollectionRows(result.rows));
  }
  parts.push(
    result.stopped
      ? `Stopped: ${result.stopped}`
      : summaryLine(result, options.dryRun),
  );
  return { output: parts.join('\n\n'), exitCode };
}
