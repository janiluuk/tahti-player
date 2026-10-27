import { hostname } from 'node:os';
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

async function readDeviceCredentials({
  stdin = process.stdin,
  stdout = process.stdout,
  email,
  password,
} = {}) {
  if (email && password) {
    return { email: email.trim(), password };
  }
  if (!stdin.isTTY) {
    throw new CliError(
      'Device login needs a TTY, or pass --email and --password.',
    );
  }
  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    const resolvedEmail =
      email?.trim() || (await prompt.question('Email: ')).trim();
    const resolvedPassword =
      password || (await prompt.question('Password: ')).trim();
    return { email: resolvedEmail, password: resolvedPassword };
  } finally {
    prompt.close();
  }
}

function formatWho(user) {
  const name = safeDisplayName(user);
  return name === user.username
    ? `@${user.username}`
    : `${name} (@${user.username})`;
}

export async function runDeviceLogin(
  config,
  {
    email,
    password,
    env = process.env,
    fetchImpl = fetch,
    deviceLabel = `tahti-cli@${hostname()}`,
  } = {},
) {
  const creds = await readDeviceCredentials({ email, password });
  if (!creds.email || !creds.password) {
    throw new CliError('Email and password are required for --device login.');
  }
  let res;
  try {
    res = await fetchImpl(`${config.apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: creds.email,
        password: creds.password,
        deviceLabel,
        refreshTokenDelivery: 'body',
      }),
    });
  } catch (error) {
    throw new CliError(
      `Could not reach the Tahti API at ${config.apiUrl}: ${error?.message ?? error}`,
    );
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new CliError(
      typeof body.error === 'string'
        ? body.error
        : `Login failed (HTTP ${res.status})`,
    );
  }
  if (body.requiresTotp) {
    throw new CliError(
      'This account needs a TOTP code. Use a personal API token for now (`tahti login` without --device).',
    );
  }
  if (!body.accessToken || !body.refreshToken || !body.expiresIn) {
    throw new CliError(
      'Login response did not include access/refresh tokens. Is the API on the JWT release?',
    );
  }
  const saved = {
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
    expiresAt: Date.now() + Number(body.expiresIn) * 1000,
    deviceLabel,
  };
  if (env.TAHTI_API_URL) {
    saved.apiUrl = config.apiUrl;
  }
  const path = writeSavedConfig(env, saved);
  if (!path) {
    throw new CliError(
      'Cannot find a home folder to save credentials. Export TAHTI_API_TOKEN instead.',
    );
  }
  const user =
    body.user ??
    (await fetchCurrentUser({ ...config, token: body.accessToken }));
  return `Signed in as ${formatWho(user)} (device session). Credentials saved to ${path}.`;
}

export async function runLogin(
  config,
  {
    token,
    device = false,
    email,
    password,
    env = process.env,
    read = readToken,
    fetchImpl,
  } = {},
) {
  if (device) {
    return runDeviceLogin(config, { email, password, env, fetchImpl });
  }
  const value = (token ?? (await read())).trim();
  if (!value) {
    throw new CliError(
      'No token given.\nCreate one at tahti.live → Settings → Account → API tokens.\nOr use `tahti login --device` with your account password.',
    );
  }
  if (!value.startsWith('tahti_')) {
    throw new CliError(
      'That does not look like a Tahti API token (they start with tahti_). Use --device for password login.',
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
  const override = env.TAHTI_API_TOKEN
    ? '\nTAHTI_API_TOKEN is set in this shell and still wins over the saved token.'
    : '';
  return `Signed in as ${formatWho(user)}. Token saved to ${path}.${override}`;
}

export async function runLogout({ env = process.env } = {}) {
  const path = removeSavedConfig(env);
  if (!path) {
    return 'No saved token.';
  }
  const override = env.TAHTI_API_TOKEN
    ? '\nTAHTI_API_TOKEN is still set in this shell; unset it too.'
    : '';
  return `Removed ${path}. Personal API tokens still work until you revoke them at tahti.live → Settings → Account → API tokens.${override}`;
}
