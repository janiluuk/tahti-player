import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { CliError, requireToken } from '../api-client.mjs';
import { runHearthisCollection } from './hearthis-collection.mjs';
import { runHearthisImportEmbeds } from './hearthis-import-embeds.mjs';
import {
  fetchHearthisUserSets,
  filterSetsByTitle,
} from './hearthis-user-sets.mjs';

const STATE_FILENAME = '.tahti-hearthis-import-sets.json';
const LEGACY_STATE_FILENAME = 'import-yaniho-sets-state.json';
const LEDGER_FILENAME = '.tahti-hearthis-sounds.json';

function statePath(outDir) {
  return join(resolve(outDir), STATE_FILENAME);
}

function loadState(outDir) {
  const path = statePath(outDir);
  try {
    return { path, state: JSON.parse(readFileSync(path, 'utf8')) };
  } catch {
    // Older Yaniho one-shot script used a different filename.
    const legacy = join(resolve(outDir), LEGACY_STATE_FILENAME);
    try {
      return { path, state: JSON.parse(readFileSync(legacy, 'utf8')) };
    } catch {
      return { path, state: { done: {}, failed: {} } };
    }
  }
}

function saveState(path, state) {
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`);
}

/**
 * Import every hearthis.at Set for a handle as a Tahti collection: download
 * downloadable tracks as local uploads (reused via a shared ledger), set the
 * Set cover and each track's cover art, then add the sounds in Set order.
 *
 * One-liner:
 *   tahti hearthis import-sets --from-user yaniho
 */
export async function runHearthisImportSets(
  config,
  {
    fromUser = null,
    outDir = '.',
    match = null,
    dryRun = false,
    coverArt = true,
    wait = 120,
    force = false,
    convertEmbeds = true,
    json = false,
    log = (line) => process.stderr.write(`${line}\n`),
  } = {},
) {
  requireToken(config);
  const handle = String(fromUser ?? '')
    .trim()
    .replace(/^@/, '');
  if (!handle) {
    throw new CliError(
      'Pass --from-user <hearthis-handle> (e.g. yaniho).\nRun `tahti hearthis import-sets --help` for usage.',
    );
  }

  const root = resolve(outDir);
  mkdirSync(root, { recursive: true });
  const { path: stateFile, state } = loadState(root);
  const ledgerPath = join(root, LEDGER_FILENAME);

  if (convertEmbeds && !dryRun) {
    log('Converting hearthis.at embeds in your library to local uploads…');
    const embedSummary = await runHearthisImportEmbeds(config, {
      dryRun: false,
      json: false,
    });
    log(embedSummary);
  }

  const { sets } = await fetchHearthisUserSets(handle);
  const queue = filterSetsByTitle(sets, match)
    .filter((set) => set.trackCount > 0)
    .sort(
      (a, b) => a.trackCount - b.trackCount || a.title.localeCompare(b.title),
    );

  const results = [];
  let exitCode = 0;

  for (const set of queue) {
    if (state.done[set.permalink] && !force) {
      results.push({
        permalink: set.permalink,
        title: set.title,
        status: 'already imported',
      });
      if (!json) {
        log(`SKIP done ${set.permalink} ${set.title}`);
      }
      continue;
    }

    const url = `https://hearthis.at/set/${set.permalink}/`;
    if (!json) {
      log(`\n=== ${set.title} (${set.trackCount} tracks) ${set.permalink} ===`);
    }
    try {
      const result = await runHearthisCollection(config, url, {
        outDir: root,
        ledgerPath,
        dryRun,
        coverArt,
        wait,
        json: false,
        log: json ? () => {} : log,
      });
      if (!json) {
        log(result.output);
      }
      const status =
        result.exitCode === 0
          ? dryRun
            ? 'would import'
            : 'imported'
          : 'failed';
      results.push({
        permalink: set.permalink,
        title: set.title,
        trackCount: set.trackCount,
        status,
        exitCode: result.exitCode,
        collectionUrl: result.collectionUrl ?? null,
      });
      if (!dryRun && result.exitCode === 0) {
        state.done[set.permalink] = {
          title: set.title,
          at: new Date().toISOString(),
        };
        delete state.failed[set.permalink];
      } else if (!dryRun) {
        state.failed[set.permalink] = {
          title: set.title,
          exitCode: result.exitCode,
          at: new Date().toISOString(),
        };
        exitCode = Math.max(exitCode, result.exitCode || 1);
      }
    } catch (error) {
      const message = error?.message ?? String(error);
      if (!json) {
        log(`FAILED ${set.permalink}: ${message}`);
      }
      results.push({
        permalink: set.permalink,
        title: set.title,
        trackCount: set.trackCount,
        status: 'failed',
        error: message,
      });
      state.failed[set.permalink] = {
        title: set.title,
        error: message,
        at: new Date().toISOString(),
      };
      exitCode = 1;
    }
    if (!dryRun) {
      saveState(stateFile, state);
    }
  }

  const summary = {
    handle,
    outDir: root,
    queued: queue.length,
    results,
    completed: Object.keys(state.done).length,
    failed: Object.keys(state.failed).length,
  };

  if (json) {
    return {
      output: JSON.stringify(summary, null, 2),
      exitCode,
    };
  }

  const lines = [
    `hearthis.at/@${handle}: ${results.length} Set(s) processed.`,
    `State: ${stateFile}`,
    `Ledger: ${ledgerPath}`,
    `Completed: ${summary.completed}; failed: ${summary.failed}.`,
    dryRun ? 'Dry run — nothing was written.' : null,
  ].filter(Boolean);
  return { output: lines.join('\n'), exitCode };
}
