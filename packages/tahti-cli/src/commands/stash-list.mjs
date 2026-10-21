import { apiGet, buildQuery, parsePositiveInt } from '../api-client.mjs';
import { formatBytes, formatDate, formatTable } from '../format.mjs';

export const MAX_STASH_LIMIT = 100;

function audioFormat(file) {
  const parts = [
    file.format,
    file.bitDepth ? `${file.bitDepth}-bit` : null,
    file.sampleRate ? `${file.sampleRate / 1000} kHz` : null,
  ].filter(Boolean);
  return parts.join(' ');
}

export function formatStashTable(files) {
  return formatTable(
    ['ID', 'FILE', 'SIZE', 'FORMAT', 'SHARES', 'ADDED'],
    files.map((file) => [
      file.id,
      file.filename,
      formatBytes(file.sizeBytes),
      audioFormat(file),
      file.shareCount || '',
      formatDate(file.createdAt),
    ]),
  );
}

export async function runStashList(config, { json = false, page, limit } = {}) {
  const pageNumber = parsePositiveInt('--page', page);
  const query = buildQuery({
    page: pageNumber,
    limit: parsePositiveInt('--limit', limit, MAX_STASH_LIMIT),
  });
  const result = await apiGet(`/api/me/stash${query}`, config);
  if (json) {
    return JSON.stringify(result, null, 2);
  }
  if (result.total === 0) {
    return 'Your stash is empty. Upload stems and masters on tahti.live → Library → Stash.';
  }
  if (result.files.length === 0) {
    return `No files on page ${result.page} (${result.total} in total).`;
  }
  const first = (result.page - 1) * result.limit + 1;
  const last = first + result.files.length - 1;
  return `${formatStashTable(result.files)}\n\n${first}-${last} of ${result.total}.`;
}
