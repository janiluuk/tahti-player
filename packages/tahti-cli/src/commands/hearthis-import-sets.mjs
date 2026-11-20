import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { CliError, requireToken } from '../api-client.mjs';
import {
  DEFAULT_PROCESSING_WAIT_SEC,
  runHearthisCollection,
} from './hearthis-collection.mjs';
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

function emptyState() {
  return { done: {}, pending: {}, failed: {} };
}

function loadState(outDir) {
  const path = statePath(outDir);
  const normalize = (raw) => {
    const state = emptyState();
    Object.assign(state.done, raw.done ?? {});
    Object.assign(state.pending, raw.pending ?? {});
    Object.assign(state.failed, raw.failed ?? {});
    // Older runs parked incomplete Sets under failed; treat exitCode-only
    // failures as pending so the next run retries them.
    for (const [permalink, entry] of Object.entries(state.failed)) {
      if (entry?.error) {
        continue;
      }
      state.pending[permalink] = {
        title: entry.title,
        at: entry.at,
        reason: 'processing or skipped tracks',
      };
      delete state.failed[permalink];
    }
    return state;
  };
  try {
    return { path, state: normalize(JSON.parse(readFileSync(path, 'utf8'))) };
  } catch {
    const legacy = join(resolve(outDir), LEGACY_STATE_FILENAME);
    try {
      return {
        path,
        state: normalize(JSON.parse(readFileSync(legacy, 'utf8'))),
      };
    } catch {
      return { path, state: emptyState() };
    }
  }
}

function saveState(path, state) {
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`);
}

/** Classify a collection run: done, pending (retryable), or failed. */
export function classifyCollectionOutcome(result) {
  if (result.stopped) {
    return {
      kind: 'failed',
      reason: result.stopped,
    };
  }
  const rows = result.rows ?? [];
  const hard =
    rows.filter(
      (row) =>
        row.item === 'failed' ||
        (row.status === 'failed' && row.item === 'skipped'),
    ).length > 0;
  const processing = rows.some((row) => row.item === 'processing');
  const skipped = rows.some((row) => row.item === 'skipped');
  if (result.exitCode === 0) {
    return { kind: 'done' };
  }
  if (hard && !processing && !skipped) {
    return { kind: 'failed', reason: 'track download/upload failed' };
  }
  if (processing || skipped) {
    return {
      kind: 'pending',
      reason: processing
        ? 'tracks still processing'
        : 'some tracks skipped (re-run after fixing embeds or downloads)',
    };
  }
  return { kind: 'failed', reason: `exit ${result.exitCode}` };
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/**
 * Import every hearthis.at Set for a handle as a Tahti collection: download
 * downloadable tracks as local uploads (reused via a shared ledger), set the
 * Set cover and each track's cover art, then add the sounds in Set order.
 *
 * One-liner:
 *   tahti hearthis import-sets --from-user yaniho
 *
 * Resumable: finished Sets live in <out>/.tahti-hearthis-import-sets.json.
 * Incomplete Sets (still processing) are retried in-process and on the next
 * run without --force.
 */
export async function runHearthisImportSets(
  config,
  {
    fromUser = null,
    outDir = '.',
    match = null,
    dryRun = false,
    coverArt = true,
    wait = DEFAULT_PROCESSING_WAIT_SEC,
    force = false,
    convertEmbeds = true,
    retries = 3,
    rounds = 2,
    retryDelayMs = 15_000,
    roundDelayMs = 30_000,
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
  const waitSec =
    typeof wait === 'number' && Number.isFinite(wait)
      ? wait
      : DEFAULT_PROCESSING_WAIT_SEC;
  const maxRetries = Math.max(1, Number(retries) || 1);
  const maxRounds = Math.max(1, Number(rounds) || 1);

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

  async function importOne(set) {
    const url = `https://hearthis.at/set/${set.permalink}/`;
    let last = null;
    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      if (!json && attempt > 1) {
        log(
          `Retry ${attempt}/${maxRetries} for ${set.permalink} (${set.title})…`,
        );
        await sleep(retryDelayMs);
      }
      last = await runHearthisCollection(config, url, {
        outDir: root,
        ledgerPath,
        dryRun,
        coverArt,
        wait: waitSec,
        json: false,
        log: json ? () => {} : log,
      });
      if (!json) {
        log(last.output);
      }
      const outcome = classifyCollectionOutcome(last);
      if (outcome.kind === 'done') {
        return { ...last, outcome };
      }
      if (outcome.kind === 'failed') {
        return { ...last, outcome };
      }
      // pending — try again while uploads finish processing
    }
    return {
      ...last,
      outcome: classifyCollectionOutcome(last),
    };
  }

  for (let round = 1; round <= maxRounds; round += 1) {
    if (!json && maxRounds > 1) {
      log(`\n— Round ${round}/${maxRounds} —`);
    }
    let progressed = false;
    for (const set of queue) {
      if (state.done[set.permalink] && !force) {
        if (round === 1) {
          results.push({
            permalink: set.permalink,
            title: set.title,
            status: 'already imported',
          });
          if (!json) {
            log(`SKIP done ${set.permalink} ${set.title}`);
          }
        }
        continue;
      }

      if (!json) {
        log(
          `\n=== ${set.title} (${set.trackCount} tracks) ${set.permalink} ===`,
        );
      }
      try {
        const result = await importOne(set);
        const { outcome } = result;
        const status =
          outcome.kind === 'done'
            ? dryRun
              ? 'would import'
              : 'imported'
            : outcome.kind === 'pending'
              ? 'pending'
              : 'failed';
        const row = {
          permalink: set.permalink,
          title: set.title,
          trackCount: set.trackCount,
          status,
          exitCode: result.exitCode,
          collectionUrl: result.collectionUrl ?? null,
          reason: outcome.reason ?? null,
        };
        if (round === 1) {
          results.push(row);
        } else {
          const existing = results.find((r) => r.permalink === set.permalink);
          if (existing) {
            Object.assign(existing, row);
          } else {
            results.push(row);
          }
        }

        if (dryRun) {
          continue;
        }
        if (outcome.kind === 'done') {
          state.done[set.permalink] = {
            title: set.title,
            at: new Date().toISOString(),
          };
          delete state.pending[set.permalink];
          delete state.failed[set.permalink];
          progressed = true;
        } else if (outcome.kind === 'pending') {
          state.pending[set.permalink] = {
            title: set.title,
            reason: outcome.reason,
            at: new Date().toISOString(),
          };
          delete state.failed[set.permalink];
          exitCode = Math.max(exitCode, 1);
        } else {
          state.failed[set.permalink] = {
            title: set.title,
            error: outcome.reason,
            exitCode: result.exitCode,
            at: new Date().toISOString(),
          };
          delete state.pending[set.permalink];
          exitCode = Math.max(exitCode, result.exitCode || 1);
        }
        saveState(stateFile, state);
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
        delete state.pending[set.permalink];
        exitCode = 1;
        if (!dryRun) {
          saveState(stateFile, state);
        }
      }
    }

    const pendingLeft = Object.keys(state.pending).length;
    if (dryRun || pendingLeft === 0 || round === maxRounds) {
      break;
    }
    if (!progressed && round > 1) {
      break;
    }
    if (!json) {
      log(
        `\n${pendingLeft} Set(s) still pending; waiting before round ${round + 1}…`,
      );
    }
    await sleep(roundDelayMs);
  }

  const summary = {
    handle,
    outDir: root,
    queued: queue.length,
    results,
    completed: Object.keys(state.done).length,
    pending: Object.keys(state.pending).length,
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
    `Completed: ${summary.completed}; pending: ${summary.pending}; failed: ${summary.failed}.`,
    dryRun ? 'Dry run — nothing was written.' : null,
  ].filter(Boolean);
  return { output: lines.join('\n'), exitCode };
}
