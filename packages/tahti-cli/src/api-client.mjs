import { readSavedConfig, writeSavedConfig } from './config-file.mjs';

const DEFAULT_API_URL = 'https://api.tahti.live';

const TOKEN_HELP =
  'Create a personal API token at tahti.live → Settings → Account → API tokens, then run `tahti login`, or use `tahti login --device` with your account password. You can also export TAHTI_API_TOKEN.';

export class CliError extends Error {}

export function resolveConfig(env = process.env, saved = readSavedConfig(env)) {
  const apiUrl = (env.TAHTI_API_URL || saved.apiUrl || DEFAULT_API_URL).replace(
    /\/$/,
    '',
  );
  const token =
    env.TAHTI_API_TOKEN ||
    (typeof saved.token === 'string' && saved.token ? saved.token : null) ||
    (typeof saved.accessToken === 'string' && saved.accessToken
      ? saved.accessToken
      : null);
  const refreshToken =
    typeof saved.refreshToken === 'string' && saved.refreshToken
      ? saved.refreshToken
      : null;
  const expiresAt =
    typeof saved.expiresAt === 'number' && Number.isFinite(saved.expiresAt)
      ? saved.expiresAt
      : null;
  return { apiUrl, token, refreshToken, expiresAt, env };
}

export function buildQuery(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function readErrorMessage(res) {
  try {
    const body = await res.json();
    if (typeof body?.error === 'string' && body.error) {
      return body.error;
    }
  } catch {
    // Non-JSON error bodies (proxies, HTML error pages) fall back to the status line.
  }
  return null;
}

export function describeHttpError(status, path, apiMessage) {
  const suffix = apiMessage ? ` (${apiMessage})` : '';
  if (status === 401) {
    return `Token invalid or missing scope${suffix}. ${TOKEN_HELP}`;
  }
  if (
    status === 403 &&
    apiMessage &&
    !/token|scope|^forbidden$/i.test(apiMessage)
  ) {
    return apiMessage;
  }
  if (status === 403) {
    return `Token invalid or missing scope${suffix}: this token is not allowed to access ${path}.`;
  }
  if (status === 404) {
    return apiMessage ?? `Not found: ${path}`;
  }
  return apiMessage
    ? `${apiMessage} (HTTP ${status})`
    : `${path} → HTTP ${status}`;
}

export function parsePositiveInt(flag, value, max) {
  if (value === undefined) {
    return undefined;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || (max && number > max)) {
    const range = max ? `1-${max}` : 'a positive integer';
    throw new CliError(`Invalid ${flag} "${value}". Expected ${range}.`);
  }
  return number;
}

function persistDeviceTokens(config) {
  const env = config.env ?? process.env;
  const saved = readSavedConfig(env);
  const next = { ...saved };
  delete next.token;
  if (config.token) {
    next.accessToken = config.token;
  }
  if (config.refreshToken) {
    next.refreshToken = config.refreshToken;
  }
  if (typeof config.expiresAt === 'number') {
    next.expiresAt = config.expiresAt;
  }
  writeSavedConfig(env, next);
}

export async function refreshAccessToken(config, { fetchImpl = fetch } = {}) {
  if (!config.refreshToken) {
    return null;
  }
  let res;
  try {
    res = await fetchImpl(`${config.apiUrl}/api/auth/token/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: config.refreshToken }),
    });
  } catch {
    return null;
  }
  if (!res.ok) {
    return null;
  }
  const body = await res.json().catch(() => ({}));
  if (!body.accessToken || !body.expiresIn) {
    return null;
  }
  config.token = body.accessToken;
  if (typeof body.refreshToken === 'string' && body.refreshToken) {
    config.refreshToken = body.refreshToken;
  }
  config.expiresAt = Date.now() + Number(body.expiresIn) * 1000;
  persistDeviceTokens(config);
  return config.token;
}

async function authorizedFetch(
  path,
  config,
  { method = 'GET', headers, body, fetchImpl = fetch } = {},
) {
  const url = `${config.apiUrl}${path}`;
  const run = (token) =>
    fetchImpl(url, {
      method,
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`,
      },
      ...(body !== undefined ? { body } : {}),
    });

  let res;
  try {
    res = await run(config.token);
  } catch (error) {
    throw new CliError(
      `Could not reach the Tahti API at ${config.apiUrl}: ${error?.message ?? error}`,
    );
  }
  if (res.status === 401 && config.refreshToken) {
    const next = await refreshAccessToken(config, { fetchImpl });
    if (next) {
      try {
        res = await run(next);
      } catch (error) {
        throw new CliError(
          `Could not reach the Tahti API at ${config.apiUrl}: ${error?.message ?? error}`,
        );
      }
    }
  }
  return res;
}

/**
 * `auth: false` is for public routes: the token is neither required nor sent,
 * because the API rejects any request carrying an invalid `tahti_` token with
 * 401, even on routes that need no auth.
 */
export async function apiGet(path, config, { auth = true } = {}) {
  if (auth && !config.token) {
    throw new CliError(`Missing API token. ${TOKEN_HELP}`);
  }
  if (!auth) {
    let res;
    try {
      res = await fetch(`${config.apiUrl}${path}`, {
        headers: { Accept: 'application/json' },
      });
    } catch (error) {
      throw new CliError(
        `Could not reach the Tahti API at ${config.apiUrl}: ${error?.message ?? error}`,
      );
    }
    if (!res.ok) {
      throw new CliError(
        describeHttpError(res.status, path, await readErrorMessage(res)),
      );
    }
    return res.json();
  }
  const res = await authorizedFetch(path, config, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new CliError(
      describeHttpError(res.status, path, await readErrorMessage(res)),
    );
  }
  return res.json();
}

export function requireToken(config) {
  if (!config.token) {
    throw new CliError(`Missing API token. ${TOKEN_HELP}`);
  }
}

/** JSON write request (POST, PATCH, PUT) that answers with a JSON body.
 * Needs a token with the `write` scope. */
export async function apiSendJson(method, path, body, config) {
  requireToken(config);
  const res = await authorizedFetch(path, config, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new CliError(
      describeHttpError(res.status, path, await readErrorMessage(res)),
    );
  }
  return res.json();
}

export function apiPost(path, body, config) {
  return apiSendJson('POST', path, body, config);
}

/** Write request whose success answer has no body (204), e.g. PATCH or a
 * POST action. Needs a token with the `write` scope. */
export async function apiSendNoContent(method, path, config, body) {
  requireToken(config);
  const headers = {
    Accept: 'application/json',
  };
  const res = await authorizedFetch(path, config, {
    method,
    headers:
      body !== undefined
        ? { ...headers, 'Content-Type': 'application/json' }
        : headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new CliError(
      describeHttpError(res.status, path, await readErrorMessage(res)),
    );
  }
}
