import { createInterface } from 'node:readline/promises';

import { CliError } from '../api-client.mjs';
import { removeSavedConfig, writeSavedConfig } from '../config-file.mjs';
import { fetchCurrentUser, safeDisplayName } from './whoami.mjs';

async function readStdin(stdin) {
  let text = '';
  for await (const chunk of stdin) {
    text += chunk;
  }
  return text;
}

export async function readToken({
  stdin = process.stdin,
  stdout = process.stdout,
} = {}) {
  if (!stdin.isTTY) {
    return (await readStdin(stdin)).trim();
  }
  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    return (await prompt.question('Paste your API token: ')).trim();
  } finally {
    prompt.close();
  }
}

export async function runLogin(
  config,
  { token, env = process.env, read = readToken } = {},
) {
  const value = (token ?? (await read())).trim();
  if (!value) {
    throw new CliError(
      'No token given.\nCreate one at tahti.live → Settings → Account → API tokens.',
    );
  }
  if (!value.startsWith('tahti_')) {
    throw new CliError(
      'That does not look like a Tahti API token (they start with tahti_).',
    );
  }
  const user = await fetchCurrentUser({ ...config, token: value });
  const saved = { token: value };
  if (env.TAHTI_API_URL) {
    saved.apiUrl = config.apiUrl;
  }
  const path = writeSavedConfig(env, saved);
  if (!path) {
    throw new CliError(
      'Cannot find a home folder to save the token in. Export TAHTI_API_TOKEN instead.',
    );
  }
  const name = safeDisplayName(user);
  const who =
    name === user.username
      ? `@${user.username}`
      : `${name} (@${user.username})`;
  const override = env.TAHTI_API_TOKEN
    ? '\nTAHTI_API_TOKEN is set in this shell and still wins over the saved token.'
    : '';
  return `Signed in as ${who}. Token saved to ${path}.${override}`;
}

export async function runLogout({ env = process.env } = {}) {
  const path = removeSavedConfig(env);
  if (!path) {
    return 'No saved token.';
  }
  const override = env.TAHTI_API_TOKEN
    ? '\nTAHTI_API_TOKEN is still set in this shell; unset it too.'
    : '';
  return `Removed ${path}. The token itself still works until you revoke it at tahti.live → Settings → Account → API tokens.${override}`;
}
