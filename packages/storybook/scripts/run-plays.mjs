#!/usr/bin/env node
/**
 * Runs the Storybook play tests in chunks of story files, one Chromium
 * session per chunk. A single session drops its sockets after a few hundred
 * files (docs/todo/storybook-play-runner-disconnect.md), so the full suite
 * never finishes in one `vitest --project storybook` run.
 *
 *   node scripts/run-plays.mjs                      every story, chunked
 *   node scripts/run-plays.mjs --changed            stories touched by uncommitted changes
 *   node scripts/run-plays.mjs --changed origin/master   …or by the branch since a ref
 *   node scripts/run-plays.mjs src/tahti-web/Studio  path filters, as for vitest
 *   options: --chunk <files> (default 50), --jobs <parallel chunks> (default 2),
 *            --group <n/total>, --list (print selected story files and stop)
 */
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = fileURLToPath(new URL('..', import.meta.url));

function parseArgs(argv) {
  const options = {
    chunk: 50,
    jobs: 2,
    group: null,
    changed: null,
    list: false,
    filters: [],
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--chunk') {
      options.chunk = Number(argv[++i]);
    } else if (arg === '--jobs') {
      options.jobs = Number(argv[++i]);
    } else if (arg === '--group') {
      options.group = parseGroup(argv[++i]);
    } else if (arg === '--list') {
      options.list = true;
    } else if (arg === '--changed') {
      const next = argv[i + 1];
      options.changed = next && !next.startsWith('-') ? argv[++i] : true;
    } else {
      options.filters.push(arg);
    }
  }
  return options;
}

function parseGroup(value) {
  const match = /^(\d+)\/(\d+)$/.exec(value ?? '');
  const index = Number(match?.[1]);
  const total = Number(match?.[2]);
  if (!match || index < 1 || total < 1 || index > total) {
    throw new Error(
      `--group must be n/total with 1 <= n <= total (got: ${value})`,
    );
  }
  return { index, total };
}

function selectGroup(files, group) {
  if (!group) {
    return files;
  }
  return files.filter((_, index) => index % group.total === group.index - 1);
}

function git(args, cwd) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(result.stderr);
  }
  return result.stdout.split('\n').filter(Boolean);
}

const GENERIC_NAMES = new Set(['index', 'types', 'utils', 'constants']);

/**
 * Story files that changed, plus stories that name a changed component (its
 * file name, or its folder for `Folder/index.ts`) or import a changed
 * lower-case module by path. One level deep: a story that reaches a changed
 * file only through another module is missed.
 */
function changedStoryFiles(ref, allStories) {
  const root = git(['rev-parse', '--show-toplevel'], packageDir)[0];
  const changed = [
    ...git(['diff', '--name-only', ref ?? 'HEAD'], root),
    ...git(['ls-files', '--others', '--exclude-standard'], root),
  ].filter(
    (file) =>
      /^packages\/[^/]+\/src\/.+\.tsx?$/.test(file) &&
      !file.includes('/src/test/'),
  );
  const storyPrefix = `${relative(root, packageDir)}/`;
  const picked = new Set();
  const names = new Set();
  for (const file of changed) {
    if (file.startsWith(storyPrefix) && file.endsWith('.stories.tsx')) {
      picked.add(file.slice(storyPrefix.length));
      continue;
    }
    if (/\.(test|stories)\.tsx?$/.test(file)) {
      continue;
    }
    const parts = file.replace(/\.tsx?$/, '').split('/');
    const base = parts.at(-1);
    const name = base === 'index' ? parts.at(-2) : base;
    if (name && !GENERIC_NAMES.has(name)) {
      names.add(name);
    }
  }
  if (names.size > 0) {
    const components = [...names].filter((name) => /^[A-Z]/.test(name));
    const modules = [...names].filter((name) => !/^[A-Z]/.test(name));
    const alternatives = [
      ...(components.length > 0 ? [`\\b(${components.join('|')})\\b`] : []),
      ...(modules.length > 0 ? [`/(${modules.join('|')})['"]`] : []),
    ];
    const pattern = new RegExp(alternatives.join('|'));
    for (const story of allStories) {
      if (picked.has(story)) {
        continue;
      }
      if (pattern.test(readFileSync(join(packageDir, story), 'utf8'))) {
        picked.add(story);
      }
    }
  }
  return allStories.filter((story) => picked.has(story));
}

function listStoryFiles({ changed, filters }) {
  const result = spawnSync(
    'pnpm',
    [
      'exec',
      'vitest',
      'list',
      '--project',
      'storybook',
      '--filesOnly',
      ...filters,
      // --json takes an optional output path, so it must not precede the
      // filters or the first filter becomes the file it overwrites.
      '--json',
    ],
    { cwd: packageDir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  const start = result.stdout.indexOf('[');
  if (result.status !== 0 || start < 0) {
    process.stderr.write(result.stderr || result.stdout);
    throw new Error('vitest list failed');
  }
  const entries = JSON.parse(result.stdout.slice(start));
  const stories = [...new Set(entries.map((entry) => entry.file))]
    .map((file) => relative(packageDir, file))
    .sort();
  if (!changed) {
    return stories;
  }
  return changedStoryFiles(changed === true ? null : changed, stories);
}

function runChunk(files, label) {
  return new Promise((resolve) => {
    let output = '';
    const child = spawn(
      'pnpm',
      ['exec', 'vitest', 'run', '--project', 'storybook', ...files],
      { cwd: packageDir, env: process.env },
    );
    const collect = (data) => {
      output += data;
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.on('close', (code) => resolve({ code, output, label }));
  });
}

function summary(output) {
  return output
    .split('\n')
    .filter((line) => /Test Files|Tests {2}| FAIL /.test(line))
    .join('\n');
}

async function runWithRetry(files, label) {
  let result = await runChunk(files, label);
  const dropped =
    result.code !== 0 &&
    /Browser connection was closed/.test(result.output) &&
    !/ FAIL .*>/.test(result.output);
  if (dropped) {
    process.stdout.write(`${label}: browser connection dropped, retrying\n`);
    result = await runChunk(files, label);
  }
  return result;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const files = selectGroup(listStoryFiles(options), options.group);
  if (options.list) {
    process.stdout.write(`${files.join('\n')}\n`);
    return;
  }
  if (files.length === 0) {
    process.stdout.write('No story files to run.\n');
    return;
  }
  const chunks = [];
  for (let i = 0; i < files.length; i += options.chunk) {
    chunks.push(files.slice(i, i + options.chunk));
  }
  process.stdout.write(
    `${files.length} story files in ${chunks.length} chunk(s), ${options.jobs} at a time${options.group ? `, group ${options.group.index}/${options.group.total}` : ''}\n`,
  );
  const started = Date.now();
  const failed = [];
  let next = 0;
  async function worker() {
    while (next < chunks.length) {
      const index = next;
      next += 1;
      const label = `chunk ${index + 1}/${chunks.length}`;
      const result = await runWithRetry(chunks[index], label);
      process.stdout.write(`${label}\n${summary(result.output)}\n`);
      if (result.code !== 0) {
        failed.push(result);
        process.stdout.write(result.output.slice(-4000));
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.max(1, options.jobs) }, () => worker()),
  );
  const seconds = Math.round((Date.now() - started) / 1000);
  process.stdout.write(
    `${chunks.length - failed.length}/${chunks.length} chunks passed in ${seconds}s\n`,
  );
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

await main();
