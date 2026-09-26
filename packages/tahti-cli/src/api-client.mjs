const DEFAULT_API_URL = 'https://api.tahti.live';

const TOKEN_HELP =
  'Create a personal API token at tahti.live → Settings → Account → API tokens and export it as TAHTI_API_TOKEN.';

export class CliError extends Error {}

export function resolveConfig(env = process.env) {
  const apiUrl = (env.TAHTI_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
  const token = env.TAHTI_API_TOKEN || null;
  return { apiUrl, token };
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

/**
 * `auth: false` is for public routes: the token is neither required nor sent,
 * because the API rejects any request carrying an invalid `tahti_` token with
 * 401, even on routes that need no auth.
 */
export async function apiGet(path, config, { auth = true } = {}) {
  if (auth && !config.token) {
    throw new CliError(`Missing API token. ${TOKEN_HELP}`);
  }
  const headers = { Accept: 'application/json' };
  if (auth) {
    headers.Authorization = `Bearer ${config.token}`;
  }
  let res;
  try {
    res = await fetch(`${config.apiUrl}${path}`, { headers });
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
