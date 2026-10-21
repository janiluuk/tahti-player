import { isForceMock } from './mode';
import { requestJson } from './request-json';

export type MyThemeVisibility = 'PRIVATE' | 'PENDING_REVIEW' | 'REJECTED';

export type MyTheme = {
  id: string;
  name: string;
  vars: Record<string, string>;
  dark: Record<string, string>;
  visibility: MyThemeVisibility;
  moderationNote: string | null;
  prStatus: 'NONE' | 'PENDING' | 'OPENED' | 'ERROR';
  prUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

let mockThemes: MyTheme[] = [];

function failure(err: unknown, fallback: string): { ok: false; error: string } {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

export function themeSubmissionStatus(theme: MyTheme): string {
  if (theme.visibility === 'REJECTED') {
    return 'Not accepted';
  }
  if (theme.visibility === 'PENDING_REVIEW') {
    if (theme.prStatus === 'OPENED') {
      return 'Approved, being added to the catalog';
    }
    if (theme.prStatus === 'PENDING') {
      return 'Approved';
    }
    return 'Waiting for review';
  }
  return 'Not submitted';
}

export async function fetchMyThemes(): Promise<Result<MyTheme[]>> {
  if (isForceMock()) {
    return { ok: true, data: [...mockThemes] };
  }
  try {
    const { data } = await requestJson<{ themes: MyTheme[] }>('/api/me/themes');
    return { ok: true, data: data.themes };
  } catch (err) {
    return failure(err, 'Could not load your themes');
  }
}

export async function submitThemeForReview(
  id: string,
): Promise<Result<MyTheme>> {
  if (isForceMock()) {
    const theme = mockThemes.find((item) => item.id === id);
    if (!theme) {
      return { ok: false, error: 'Theme not found' };
    }
    theme.visibility = 'PENDING_REVIEW';
    theme.moderationNote = null;
    return { ok: true, data: { ...theme } };
  }
  try {
    const { data } = await requestJson<MyTheme>(
      `/api/me/themes/${encodeURIComponent(id)}/submit-public`,
      { method: 'POST' },
    );
    return { ok: true, data };
  } catch (err) {
    return failure(err, 'Could not submit the theme');
  }
}

export async function submitThemeToCommunity(theme: {
  name: string;
  vars?: Record<string, string>;
  dark?: Record<string, string>;
}): Promise<Result<MyTheme>> {
  const name = theme.name.trim().slice(0, 80);
  const vars = theme.vars ?? {};
  const dark = theme.dark ?? {};
  if (!name) {
    return { ok: false, error: 'The theme needs a name.' };
  }
  if (Object.keys(vars).length === 0 && Object.keys(dark).length === 0) {
    return { ok: false, error: 'This theme has no colours to share.' };
  }
  if (isForceMock()) {
    const created: MyTheme = {
      id: `mock-theme-${Date.now()}`,
      name,
      vars,
      dark,
      visibility: 'PRIVATE',
      moderationNote: null,
      prStatus: 'NONE',
      prUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockThemes = [created, ...mockThemes];
    return submitThemeForReview(created.id);
  }
  try {
    const { data: created } = await requestJson<MyTheme>('/api/me/themes', {
      method: 'POST',
      body: JSON.stringify({ name, vars, dark }),
    });
    return submitThemeForReview(created.id);
  } catch (err) {
    return failure(err, 'Could not submit the theme');
  }
}

export async function deleteMyTheme(id: string): Promise<Result<null>> {
  if (isForceMock()) {
    mockThemes = mockThemes.filter((item) => item.id !== id);
    return { ok: true, data: null };
  }
  try {
    await requestJson(`/api/me/themes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { ok: true, data: null };
  } catch (err) {
    return failure(err, 'Could not delete the theme');
  }
}
