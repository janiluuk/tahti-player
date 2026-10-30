#!/usr/bin/env node
// Regenerates packages/tahti-web/STORYBOOK-SURFACES.md from each story
// file's meta `title`.
//   --check   exit 1 when the file is stale
//   --report  print a Markdown summary of stale rows (empty when current)
//   --stage   regenerate and `git add` the file (lint-staged)
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const storiesRoot = new URL('../packages/storybook/src/', import.meta.url)
  .pathname;
const outPath = new URL(
  '../packages/tahti-web/STORYBOOK-SURFACES.md',
  import.meta.url,
).pathname;

// Only the meta object's own `title` counts: fixtures inside a story file
// often carry a `title` too, so the search starts at the meta declaration.
const META_START = /(?:const\s+meta\b[^=]*=\s*\{|export\s+default\s*\{)/;
const TITLE = /\btitle:\s*(['"`])([^'"`]+)\1/;

function storyFiles(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        return entry.name.startsWith('_') ? [] : storyFiles(path);
      }
      return /\.stories\.(tsx?|jsx?|mjs)$/.test(entry.name) ? [path] : [];
    })
    .sort();
}

function metaTitle(source, file) {
  const start = source.search(META_START);
  const match = start === -1 ? null : TITLE.exec(source.slice(start));
  if (!match) {
    throw new Error(`No meta title found in ${file}`);
  }
  return match[2];
}

const files = storyFiles(storiesRoot).map((path) =>
  relative(storiesRoot, path),
);
const ordered = [
  ...files.filter((f) => f.startsWith('tahti-web/')),
  ...files.filter((f) => !f.startsWith('tahti-web/')),
];
const rows = ordered.map((file) => {
  const title = metaTitle(readFileSync(join(storiesRoot, file), 'utf8'), file);
  return `| \`${title}\` | \`${file}\` |`;
});

const output = `# Storybook surface cheat sheet

Lookup before inventing UI. Run \`pnpm storybook\`. Stories under \`packages/storybook/src/\`.

Generated from story \`title\` fields by \`pnpm storybook:surfaces\` (scripts/generate-storybook-surfaces.mjs) - do not edit by hand. Prefer matching title; keep live data when swapping.

| Story title | File |
| --- | --- |
${rows.join('\n')}

If nothing matches: add a story with today’s states, flag \`Missing states:\` / \`Orphan:\`.
`;

const ROW = /^\| `([^`]+)` \| `([^`]+)` \|$/;

function titlesByFile(markdown) {
  return new Map(
    markdown
      .split('\n')
      .map((line) => ROW.exec(line))
      .filter(Boolean)
      .map(([, title, file]) => [file, title]),
  );
}

function staleReport(committed) {
  const before = titlesByFile(committed);
  const after = titlesByFile(output);
  const added = [...after].filter(([file]) => !before.has(file));
  const removed = [...before].filter(([file]) => !after.has(file));
  const retitled = [...after].filter(
    ([file, title]) => before.has(file) && before.get(file) !== title,
  );
  const row = ([file, title]) => `| \`${title}\` | \`${file}\` |`;
  const section = (heading, entries, format = row) =>
    entries.length
      ? [`**${heading}**`, '', '| Story title | File |', '| --- | --- |']
          .concat(entries.map(format))
          .join('\n')
      : null;
  return [
    '`packages/tahti-web/STORYBOOK-SURFACES.md` is out of date with the stories on this PR. Run `pnpm storybook:surfaces` and commit the result.',
    section('Added', added),
    section('Removed', removed),
    section('Retitled', retitled, ([file, title]) =>
      row([file, `${before.get(file)}\` → \`${title}`]),
    ),
    added.length + removed.length + retitled.length === 0
      ? 'Only row order or surrounding text differs (usually a hand edit).'
      : null,
  ]
    .filter(Boolean)
    .join('\n\n');
}

const committed = readFileSync(outPath, 'utf8');
const stale = committed !== output;

if (process.argv.includes('--check')) {
  if (stale) {
    console.error(
      'STORYBOOK-SURFACES.md is stale - run `pnpm storybook:surfaces`.',
    );
    process.exit(1);
  }
} else if (process.argv.includes('--report')) {
  if (stale) {
    console.log(staleReport(committed));
  }
} else {
  writeFileSync(outPath, output);
  if (process.argv.includes('--stage')) {
    execFileSync('git', ['add', outPath]);
  }
  console.log(
    `Wrote ${rows.length} story surfaces to ${relative('.', outPath)}`,
  );
}
