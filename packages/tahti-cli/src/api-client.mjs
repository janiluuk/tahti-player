const DEFAULT_API_URL = 'https://api.tahti.live';

export class CliError extends Error {}

export function resolveConfig(env = process.env) {
  const apiUrl = (env.TAHTI_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
  const token = env.TAHTI_API_TOKEN || null;
  return { apiUrl, token };
}

export async function apiGet(path, config) {
  if (!config.token) {
    throw new CliError(
      'Missing API token. Set TAHTI_API_TOKEN to a personal API token from tahti.live → Settings → Account → API tokens.',
    );
  }
  const res = await fetch(`${config.apiUrl}${path}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${config.token}`,
    },
  });
  if (!res.ok) {
    let detail = `${path} → ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) {
        detail = body.error;
      }
    } catch {
      // ignore
    }
    throw new CliError(detail);
  }
  return res.json();
}
