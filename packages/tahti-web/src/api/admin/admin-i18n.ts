import type { FetchMeta } from '../client';
import { apiBase, getJson, sendJson } from '../http';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
} from '../mode';

// ── i18n / Languages ─────────────────────────────────────────────────────

export type AdminLanguage = {
  code: string;
  name: string;
  translatedKeys: number;
  totalKeys: number;
  isDefault: boolean;
  updatedAt: string;
};

const BASE_KEY_COUNT = 812;

let mockLanguagesState: AdminLanguage[] | null = null;

function mockLanguages(): AdminLanguage[] {
  if (!mockLanguagesState) {
    mockLanguagesState = [
      {
        code: 'en',
        name: 'English',
        translatedKeys: BASE_KEY_COUNT,
        totalKeys: BASE_KEY_COUNT,
        isDefault: true,
        updatedAt: '2026-01-10T09:00:00.000Z',
      },
      {
        code: 'fi',
        name: 'Finnish',
        translatedKeys: BASE_KEY_COUNT,
        totalKeys: BASE_KEY_COUNT,
        isDefault: false,
        updatedAt: '2026-03-02T09:00:00.000Z',
      },
      {
        code: 'sv',
        name: 'Swedish',
        translatedKeys: 214,
        totalKeys: BASE_KEY_COUNT,
        isDefault: false,
        updatedAt: '2026-06-18T09:00:00.000Z',
      },
    ];
  }
  return mockLanguagesState;
}

export async function fetchAdminLanguages(): Promise<{
  data: AdminLanguage[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockLanguages(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ languages: AdminLanguage[] }>(
      '/api/admin/i18n/languages',
    );
    return { data: data.languages, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockLanguages(), meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function createAdminLanguage(input: {
  code: string;
  name: string;
}): Promise<{ ok: true; data: AdminLanguage } | { ok: false; error: string }> {
  if (isForceMock()) {
    if (mockLanguages().some((l) => l.code === input.code)) {
      return { ok: false, error: `Language "${input.code}" already exists.` };
    }
    const lang: AdminLanguage = {
      code: input.code,
      name: input.name,
      translatedKeys: 0,
      totalKeys: BASE_KEY_COUNT,
      isDefault: false,
      updatedAt: new Date().toISOString(),
    };
    mockLanguagesState = [...mockLanguages(), lang];
    return { ok: true, data: lang };
  }
  try {
    const data = await sendJson<AdminLanguage>(
      '/api/admin/i18n/languages',
      'POST',
      input,
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed' };
  }
}

export type AdminLanguageImportResult = { imported: number; skipped: number };

/** CSV is expected as `english,translation` (optionally `key,english,translation`)
 * with an optional header row — the source/base column is always English. */
export async function importAdminLanguageCsv(
  code: string,
  file: File,
): Promise<
  { ok: true; data: AdminLanguageImportResult } | { ok: false; error: string }
> {
  const text = await file.text();
  const rows = text.split(/\r?\n/).filter((r) => r.trim().length > 0);
  const looksLikeHeader = /english|^key,|^en,/i.test(rows[0] ?? '');
  const dataRows = looksLikeHeader ? rows.slice(1) : rows;
  const validRows = dataRows.filter((r) => {
    const cols = r.split(',');
    return cols.length >= 2 && cols[cols.length - 1]?.trim();
  });
  const result: AdminLanguageImportResult = {
    imported: validRows.length,
    skipped: dataRows.length - validRows.length,
  };

  if (isForceMock()) {
    const lang = mockLanguages().find((l) => l.code === code);
    if (!lang) {
      return { ok: false, error: `Unknown language "${code}".` };
    }
    lang.translatedKeys = Math.min(
      lang.totalKeys,
      lang.translatedKeys + result.imported,
    );
    lang.updatedAt = new Date().toISOString();
    return { ok: true, data: result };
  }
  try {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(
      `${apiBase()}/api/admin/i18n/languages/${encodeURIComponent(code)}/import`,
      { method: 'POST', credentials: 'include', body: form },
    );
    if (!res.ok) {
      throw new Error(`import → ${res.status}`);
    }
    const data = (await res.json()) as AdminLanguageImportResult;
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Import failed',
    };
  }
}
