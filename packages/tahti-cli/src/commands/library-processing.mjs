import { apiGet, parsePositiveInt } from '../api-client.mjs';
import { formatTable } from '../format.mjs';

export const DEFAULT_WAIT_SECONDS = 600;
const POLL_MS = 5000;

export async function fetchProcessing(config) {
  return apiGet('/api/me/sound/processing', config);
}

export function formatProcessingTable(processing) {
  return formatTable(
    ['ID', 'STATUS', 'TITLE'],
    processing.map((sound) => [sound.id, sound.status, sound.title]),
  );
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runLibraryProcessing(
  config,
  { json = false, wait = false, timeout, pollMs = POLL_MS } = {},
) {
  const limitSeconds =
    parsePositiveInt('--timeout', timeout) ?? DEFAULT_WAIT_SECONDS;
  let result = await fetchProcessing(config);
  if (wait) {
    const deadline = Date.now() + limitSeconds * 1000;
    while (result.processing.length > 0 && Date.now() < deadline) {
      await sleep(pollMs);
      result = await fetchProcessing(config);
    }
  }
  if (json) {
    return JSON.stringify(result, null, 2);
  }
  if (result.processing.length === 0) {
    return 'Nothing is processing.';
  }
  const table = formatProcessingTable(result.processing);
  if (wait) {
    return {
      output: `${table}\n\nStill processing after ${limitSeconds} s.`,
      exitCode: 1,
    };
  }
  return table;
}
