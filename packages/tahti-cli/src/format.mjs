export const EMPTY_CELL = '-';

export function formatDuration(durationSec) {
  if (
    durationSec === null ||
    durationSec === undefined ||
    Number.isNaN(durationSec)
  ) {
    return '--:--';
  }
  const totalSeconds = Math.floor(durationSec);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatDate(value) {
  if (!value) {
    return EMPTY_CELL;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return EMPTY_CELL;
  }
  return date.toISOString().slice(0, 10);
}

export function formatBytes(value) {
  const bytes = Number(value);
  if (value === null || value === undefined || !Number.isFinite(bytes)) {
    return EMPTY_CELL;
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return unit === 0 ? `${size} B` : `${size.toFixed(1)} ${units[unit]}`;
}

function cellText(cell) {
  return cell === null || cell === undefined || cell === ''
    ? EMPTY_CELL
    : String(cell);
}

export function formatTable(header, rows) {
  const textRows = rows.map((row) => row.map(cellText));
  const widths = header.map((label, index) =>
    Math.max(label.length, ...textRows.map((row) => row[index].length)),
  );
  const formatRow = (row) =>
    row
      .map((cell, index) => cell.padEnd(widths[index]))
      .join('  ')
      .trimEnd();
  return [formatRow(header), ...textRows.map(formatRow)].join('\n');
}

export function formatDetails(pairs) {
  const width = Math.max(...pairs.map(([label]) => label.length));
  return pairs
    .map(([label, value]) => `${label.padEnd(width)}  ${cellText(value)}`)
    .join('\n');
}
