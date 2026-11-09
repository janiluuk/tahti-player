import { dateLocaleTag } from './locale';

/** Shared formatting/grouping helpers for the admin Storage/Files views
 * (`AdminStorageView`, `AdminStorageUserView`). Kept framework-free so they're
 * cheap to unit test independently of the views that render them. */

/** Human-readable byte size. `null` covers disk readings that aren't
 * available (e.g. `localDisk`/`objectStorage` when the host statfs call
 * failed, or R2's fixed total/free which don't exist for a usage-billed
 * backend) — rendered as an em dash rather than "0 B" or "NaN". */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) {
    return '—';
  }
  if (bytes >= 1024 ** 3) {
    return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  }
  if (bytes >= 1024 ** 2) {
    return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${Math.round(bytes)} B`;
}

export function bytesToMb(bytes: number): number {
  return Math.round(bytes / (1024 * 1024));
}

/** Quota display — the backend resolves whether an account is unlimited
 * (paying/association-member accounts, per storage-policy.md); this never
 * re-derives that from tier client-side, it only renders the flag. */
export function formatQuota(
  quotaBytes: number | null | undefined,
  unlimited: boolean,
): string {
  if (unlimited) {
    return 'Unlimited';
  }
  return formatBytes(quotaBytes);
}

/** Percentage of quota used, or `null` when there's no meaningful percentage
 * to show (unlimited accounts, or a zero/missing quota). */
export function usagePercent(
  usedBytes: number,
  quotaBytes: number | null | undefined,
  unlimited: boolean,
): number | null {
  if (unlimited || quotaBytes == null || quotaBytes <= 0) {
    return null;
  }
  return (usedBytes / quotaBytes) * 100;
}

/** Upload date for a file row — short, locale-aware, stable across renders. */
export function formatFileDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString(dateLocaleTag(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export type FileForGrouping = {
  userId: string;
  username: string;
  displayName: string;
  sizeBytes: number | null;
};

export type UserFileGroup = {
  userId: string;
  username: string;
  displayName: string;
  totalBytes: number;
  fileCount: number;
};

/** Group a flat file list into per-user totals, sorted by usage descending —
 * the Files tab's "group by user" view and the storage chart's data source. */
export function groupFilesByUser<T extends FileForGrouping>(
  files: T[],
): UserFileGroup[] {
  const byUser = new Map<string, UserFileGroup>();
  for (const file of files) {
    const size = file.sizeBytes ?? 0;
    const existing = byUser.get(file.userId);
    if (existing) {
      existing.totalBytes += size;
      existing.fileCount += 1;
    } else {
      byUser.set(file.userId, {
        userId: file.userId,
        username: file.username,
        displayName: file.displayName,
        totalBytes: size,
        fileCount: 1,
      });
    }
  }
  return [...byUser.values()].sort((a, b) => b.totalBytes - a.totalBytes);
}

export type UserFileRowGroup<T> = UserFileGroup & { files: T[] };

/** Like `groupFilesByUser`, but keeps each user's own rows (in whatever
 * order `files` was already in — pass an already-sorted list to preserve
 * that sort within each group) instead of collapsing to totals only. */
export function groupFileRowsByUser<T extends FileForGrouping>(
  files: T[],
): UserFileRowGroup<T>[] {
  const byUser = new Map<string, UserFileRowGroup<T>>();
  for (const file of files) {
    const size = file.sizeBytes ?? 0;
    const existing = byUser.get(file.userId);
    if (existing) {
      existing.totalBytes += size;
      existing.fileCount += 1;
      existing.files.push(file);
    } else {
      byUser.set(file.userId, {
        userId: file.userId,
        username: file.username,
        displayName: file.displayName,
        totalBytes: size,
        fileCount: 1,
        files: [file],
      });
    }
  }
  return [...byUser.values()].sort((a, b) => b.totalBytes - a.totalBytes);
}
