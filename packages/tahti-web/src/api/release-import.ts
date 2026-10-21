import { isForceMock } from './mode';
import { requestJson } from './request-json';

export type ReleaseImportResult = {
  created: number;
  skipped: number;
  releaseIds: string[];
  errors: string[];
};

/** Columns tahti-org's `parseReleaseImportCsv` reads when there is no header
 * row; with a header it also takes aliases like `title`, `date`, `track`. */
export const RELEASE_CSV_COLUMNS = [
  'releaseTitle',
  'type',
  'releaseDate',
  'trackTitle',
  'isrc',
  'upc',
  'description',
] as const;

/** Creates draft releases from a CSV with one row per track; rows with the
 * same release title and date become one release (max 100 per import). */
export async function importReleasesCsv(
  csv: string,
): Promise<
  { ok: true; data: ReleaseImportResult } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return {
      ok: true,
      data: {
        created: 1,
        skipped: 0,
        releaseIds: ['mock-release'],
        errors: [],
      },
    };
  }
  try {
    const { data } = await requestJson<ReleaseImportResult>(
      '/api/me/releases/import',
      { method: 'POST', body: JSON.stringify({ csv }) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Import failed',
    };
  }
}
