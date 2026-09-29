import { getJson, sendJson } from '../http';
import { isForceMock } from '../mode';

export type AdminThemeVisibility = 'PRIVATE' | 'PENDING_REVIEW' | 'REJECTED';

export type AdminThemePrStatus = 'NONE' | 'PENDING' | 'OPENED' | 'ERROR';

export type AdminTheme = {
  id: string;
  name: string;
  vars: Record<string, string>;
  dark: Record<string, string>;
  visibility: AdminThemeVisibility;
  moderationNote: string | null;
  prStatus: AdminThemePrStatus;
  prUrl: string | null;
  createdAt: string;
  updatedAt: string;
  authorUsername: string;
};

let mockThemes: AdminTheme[] | null = null;

function themeState(): AdminTheme[] {
  if (!mockThemes) {
    mockThemes = [
      {
        id: 'theme-1',
        name: 'Revontulet',
        vars: {
          '--background': '#0b1d26',
          '--foreground': '#e8f6f3',
          '--primary': '#3ddc97',
          '--accent-pink': '#c64fd8',
        },
        dark: {},
        visibility: 'PENDING_REVIEW',
        moderationNote: null,
        prStatus: 'NONE',
        prUrl: null,
        createdAt: '2026-09-20T10:00:00.000Z',
        updatedAt: '2026-09-20T10:00:00.000Z',
        authorUsername: 'aurora',
      },
    ];
  }
  return mockThemes;
}

export function canApproveTheme(theme: AdminTheme): boolean {
  return (
    theme.visibility === 'PENDING_REVIEW' &&
    (theme.prStatus === 'NONE' || theme.prStatus === 'ERROR')
  );
}

export function themeSwatches(theme: AdminTheme, limit = 6): string[] {
  return Object.values(theme.vars)
    .filter((value) => /^#[0-9a-f]{3,8}$|^rgb|^hsl|^oklch/i.test(value.trim()))
    .slice(0, limit);
}

export async function fetchAdminThemes(
  visibility?: AdminThemeVisibility,
): Promise<{ ok: true; themes: AdminTheme[] } | { ok: false; error: string }> {
  if (isForceMock()) {
    const themes = themeState().filter(
      (theme) => !visibility || theme.visibility === visibility,
    );
    return { ok: true, themes };
  }
  try {
    const query = visibility ? `?visibility=${visibility}` : '';
    const data = await getJson<{ themes: AdminTheme[] }>(
      `/api/admin/themes${query}`,
    );
    return { ok: true, themes: data.themes };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not load themes',
    };
  }
}

export async function approveAdminTheme(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    const theme = themeState().find((item) => item.id === id);
    if (theme) {
      theme.prStatus = 'PENDING';
    }
    return { ok: true };
  }
  try {
    await sendJson(
      `/api/admin/themes/${encodeURIComponent(id)}/approve`,
      'POST',
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not approve the theme',
    };
  }
}

export async function rejectAdminTheme(
  id: string,
  moderationNote: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const note = moderationNote.trim();
  if (!note) {
    return { ok: false, error: 'Tell the author why the theme was rejected.' };
  }
  if (isForceMock()) {
    const theme = themeState().find((item) => item.id === id);
    if (theme) {
      theme.visibility = 'REJECTED';
      theme.moderationNote = note;
    }
    return { ok: true };
  }
  try {
    await sendJson(
      `/api/admin/themes/${encodeURIComponent(id)}/reject`,
      'POST',
      {
        moderationNote: note,
      },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not reject the theme',
    };
  }
}
