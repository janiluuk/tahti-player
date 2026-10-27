/**
 * Verify Tahti-Nuclear player MCP sources match a sibling upstream Nuclear checkout.
 * Usage: node packages/tahti-web/scripts/verify-nuclear-mcp-parity.mjs
 * Expects /home/jani/workspace/nuclear (or NUCLEAR_UPSTREAM) next to tahti-nuclear.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const forkRoot = resolve(__dirname, '../../..');
const upstreamRoot = resolve(
  process.env.NUCLEAR_UPSTREAM || join(forkRoot, '..', 'nuclear'),
);

const relPaths = [
  'packages/player/src-tauri/src/mcp/mod.rs',
  'packages/player/src-tauri/src/mcp/tools.rs',
  'packages/player/src-tauri/src/mcp/metadata.rs',
  'packages/plugin-sdk/src/mcp/meta.ts',
  'packages/plugin-sdk/src/mcp/index.ts',
];

function md5(path) {
  return createHash('md5').update(readFileSync(path)).digest('hex');
}

if (!existsSync(upstreamRoot)) {
  console.error('Upstream Nuclear not found at', upstreamRoot);
  console.error('Set NUCLEAR_UPSTREAM or clone nuclear next to tahti-nuclear.');
  process.exit(2);
}

let drift = 0;
for (const rel of relPaths) {
  const a = join(upstreamRoot, rel);
  const b = join(forkRoot, rel);
  if (!existsSync(a) || !existsSync(b)) {
    console.error('MISSING', rel);
    drift += 1;
    continue;
  }
  const ha = md5(a);
  const hb = md5(b);
  if (ha === hb) {
    console.log('OK ', rel);
  } else {
    console.error('DRIFT', rel);
    drift += 1;
  }
}

if (drift) {
  console.error(`\n${drift} file(s) differ from upstream Nuclear MCP.`);
  process.exit(1);
}
console.log('\nNuclear MCP stack is identical to upstream (as-is).');
