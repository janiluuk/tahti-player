#!/usr/bin/env node
// Regenerates packages/tahti-web/STORYBOOK-SURFACES.md from each story
// file's meta `title`. Run with --check to fail when the file is stale.
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

if (process.argv.includes('--check')) {
  if (readFileSync(outPath, 'utf8') !== output) {
    console.error(
      'STORYBOOK-SURFACES.md is stale - run `pnpm storybook:surfaces`.',
    );
    process.exit(1);
  }
} else {
  writeFileSync(outPath, output);
  console.log(
    `Wrote ${rows.length} story surfaces to ${relative('.', outPath)}`,
  );
}
