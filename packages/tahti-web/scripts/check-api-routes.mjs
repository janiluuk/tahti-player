// Finds API paths the app calls that the Tahti API does not serve.
//
//   pnpm check:api-routes
//
// Reads the OpenAPI export of the sibling tahti-org checkout (or the file in
// TAHTI_OPENAPI; CI downloads openapi.json from the latest tahti-org release)
// and every '/api/...' string in src/. A path that is built in
// pieces ('/api/me/rtmp-targets' + '/' + id) passes when a served path starts
// with it. Known exceptions live in api-routes-allowlist.json, each with the
// reason it is allowed. src/remote/ is skipped: the Jam phone remote calls
// the desktop app's local Jam server, not the Tahti API.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const scriptDirectory = path.dirname(new URL(import.meta.url).pathname);
const openApiPath =
  process.env.TAHTI_OPENAPI ??
  path.resolve(scriptDirectory, '../../../../tahti-org/openapi.json');
const sourceRoot = path.resolve(scriptDirectory, '../src');
const allowlistPath = path.resolve(
  scriptDirectory,
  'api-routes-allowlist.json',
);

const PARAM = '\u0000';

/** '/api/me/sound/{id}/shares' and '/api/me/sound/${x}/shares' → same shape. */
export function normalizePath(raw) {
  return raw
    .split('?')[0]
    .replace(/\$\{[^}]*\}/g, PARAM)
    .replace(/\{[^}]*\}/g, PARAM)
    .replace(/:[A-Za-z_]+\??/g, PARAM)
    .replace(/\/+$/, '');
}

function segments(normalized) {
  return normalized
    .split('/')
    .map((part) => (part.includes(PARAM) ? PARAM : part));
}

/**
 * Align called segments to a served path.
 *
 * Params match params; literals match equal literals. A caller param may stand
 * for a concrete served segment (`/${action}` → `/pause`), and a concrete
 * caller segment may stand for a served param (`/tahti-radio` → `/{slug}`),
 * but not both in the same path — otherwise
 * `/api/me/sound/${id}/group-membership` falsely matches
 * `/api/me/sound/shares/{id}`. When the call is only a prefix of the served
 * path, a trailing caller param may also cover a literal (`` `/api/foo${id}` ``).
 */
function pathAligns(want, have) {
  if (have.length < want.length) {
    return false;
  }
  let callerParamToLiteral = false;
  let callerLiteralToParam = false;
  for (let index = 0; index < want.length; index += 1) {
    const part = want[index];
    const other = have[index];
    if (part === PARAM && other === PARAM) {
      continue;
    }
    if (part === other) {
      continue;
    }
    if (part === PARAM) {
      if (callerLiteralToParam) {
        return false;
      }
      callerParamToLiteral = true;
      continue;
    }
    if (other === PARAM) {
      if (callerParamToLiteral) {
        return false;
      }
      callerLiteralToParam = true;
      continue;
    }
    return false;
  }
  return true;
}

/** True when `called` is a served path, or the start of one. */
export function isServed(called, servedPaths) {
  const want = segments(called);
  return servedPaths.some((served) => pathAligns(want, segments(served)));
}

/** Allowlist entries the API serves now: the exception has expired. */
export function servedAllowances(entries, servedPaths) {
  return entries.filter((entry) => {
    const want = segments(normalizePath(entry));
    return servedPaths.some((served) => {
      const have = segments(served);
      return have.length === want.length && pathAligns(want, have);
    });
  });
}

export function extractApiPaths(source) {
  const found = [];
  const pattern = /(['"`])(\/api\/[^'"`\s]*)\1/g;
  for (const match of source.matchAll(pattern)) {
    const line = source.slice(0, match.index).split('\n').length;
    found.push({ raw: match[2], line });
  }
  return found;
}

function sourceFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'mocks', 'remote'].includes(entry.name)) {
        files.push(...sourceFiles(full));
      }
    } else if (
      /\.tsx?$/.test(entry.name) &&
      !/\.(test|stories)\.tsx?$/.test(entry.name)
    ) {
      files.push(full);
    }
  }
  return files;
}

function main() {
  if (!fs.existsSync(openApiPath)) {
    console.error(
      `No OpenAPI export at ${openApiPath}. Run "pnpm --filter @tahti/api openapi:export" in tahti-org, or set TAHTI_OPENAPI.`,
    );
    process.exit(1);
  }
  const openApi = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
  const served = Object.keys(openApi.paths ?? {}).map(normalizePath);
  const allowlist = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));
  const allowed = new Set(Object.keys(allowlist));
  const usedAllowances = new Set();
  const unexplained = [...allowed].filter(
    (entry) =>
      typeof allowlist[entry] !== 'string' || allowlist[entry].trim() === '',
  );

  const missing = [];
  for (const file of sourceFiles(sourceRoot)) {
    const source = fs.readFileSync(file, 'utf8');
    for (const { raw, line } of extractApiPaths(source)) {
      // Prose and glob-like mentions ('/api/me/totp/* in Settings') are not calls.
      if (/[*\s]/.test(raw)) {
        continue;
      }
      const display = raw.split('?')[0].replace(/\$\{[^}]*\}/g, ':param');
      if (allowed.has(display)) {
        usedAllowances.add(display);
        continue;
      }
      if (!isServed(normalizePath(raw), served)) {
        missing.push(
          `${display}  (${path.relative(sourceRoot, file)}:${line})`,
        );
      }
    }
  }

  const stale = [...allowed].filter((entry) => !usedAllowances.has(entry));
  const nowServed = servedAllowances([...allowed], served);
  if (missing.length > 0) {
    console.error('The app calls API paths the server does not serve:');
    for (const entry of missing) {
      console.error(`  ${entry}`);
    }
    console.error(
      'CI checks the latest tahti-org GitHub release OpenAPI (production).',
    );
    console.error(
      'Merge the API PR first and wait for that release, or add each path to',
    );
    console.error(
      'packages/tahti-web/scripts/api-routes-allowlist.json with a reason',
    );
    console.error('(remove the entries once the matching release ships).');
  }
  if (stale.length > 0) {
    console.error('Allowlist entries no longer used (remove them):');
    for (const entry of stale) {
      console.error(`  ${entry}`);
    }
  }
  if (nowServed.length > 0) {
    console.error('Allowlist entries the API now serves (remove them):');
    for (const entry of nowServed) {
      console.error(`  ${entry}`);
    }
  }
  if (unexplained.length > 0) {
    console.error('Allowlist entries without a reason:');
    for (const entry of unexplained) {
      console.error(`  ${entry}`);
    }
  }
  if (
    missing.length > 0 ||
    stale.length > 0 ||
    nowServed.length > 0 ||
    unexplained.length > 0
  ) {
    process.exit(1);
  }
  console.log(
    `Every API path in src/ is served (${served.length} served paths, ${allowed.size} allowed exceptions).`,
  );
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}
