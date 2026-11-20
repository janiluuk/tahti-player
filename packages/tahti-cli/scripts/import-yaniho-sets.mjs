/**
 * Thin wrapper around `tahti hearthis import-sets` for the Yaniho e2e account.
 * Prefer the one-liner once logged in:
 *
 *   tahti hearthis import-sets --from-user yaniho --out .yaniho-hearthis-import --skip-embeds
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveConfig } from '../src/api-client.mjs';
import { DEFAULT_PROCESSING_WAIT_SEC } from '../src/commands/hearthis-collection.mjs';
import { runHearthisImportSets } from '../src/commands/hearthis-import-sets.mjs';

const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../.yaniho-hearthis-import',
);

async function loginYaniho() {
  const env = Object.fromEntries(
    readFileSync('/home/jani/.tahti-e2e.env', 'utf8')
      .split('\n')
      .filter((line) => line.includes('='))
      .map((line) => {
        const i = line.indexOf('=');
        return [line.slice(0, i), line.slice(i + 1)];
      }),
  );
  const login = await fetch('https://api.tahti.live/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email: env.TAHTI_E2E_EMAIL,
      password: env.TAHTI_E2E_PASSWORD,
      refreshTokenDelivery: 'body',
    }),
  });
  const body = await login.json();
  if (!login.ok) {
    throw new Error(`login failed: ${login.status} ${JSON.stringify(body)}`);
  }
  writeFileSync(
    '/home/jani/.config/tahti/config.json',
    `${JSON.stringify(
      {
        accessToken: body.accessToken,
        refreshToken: body.refreshToken,
        expiresAt: Date.now() + body.expiresIn * 1000,
        deviceLabel: 'yaniho-sets-import',
      },
      null,
      2,
    )}\n`,
    { mode: 0o600 },
  );
  return body.user?.username;
}

mkdirSync(OUT, { recursive: true });
const username = await loginYaniho();
console.log(`logged in as ${username}; out=${OUT}`);

const result = await runHearthisImportSets(resolveConfig(), {
  fromUser: 'yaniho',
  outDir: OUT,
  coverArt: true,
  convertEmbeds: !process.argv.includes('--skip-embeds'),
  dryRun: process.argv.includes('--dry-run'),
  force: process.argv.includes('--force'),
  wait: DEFAULT_PROCESSING_WAIT_SEC,
  retries: 4,
  rounds: 3,
  match:
    process.argv
      .find((arg) => arg.startsWith('--only='))
      ?.slice('--only='.length) ?? null,
  json: false,
});
console.log(result.output);
process.exit(result.exitCode);
