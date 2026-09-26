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

export async function apiGet(path, config) {
  if (!config.token) {
    throw new CliError(`Missing API token. ${TOKEN_HELP}`);
  }
  let res;
  try {
    res = await fetch(`${config.apiUrl}${path}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${config.token}`,
      },
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
