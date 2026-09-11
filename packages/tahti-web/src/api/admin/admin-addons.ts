import type { FetchMeta } from '../client';
import { getJson, sendJson } from '../http';
import { failMeta, isForceMock } from '../mode';

// ── Admin add-ons ────────────────────────────────────────────────────────

export type AdminAddonScope = 'LISTENER' | 'ARTIST' | 'ADMIN';
export type AdminAddonStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISABLED';

// The real ../tahti-org backend (packages/db/prisma/schema.prisma's `Addon`
// model + apps/api/src/routes/admin/addons.ts) is a full widget-bundle store
// with versioning, sandboxed rendering, and a moderation lifecycle — not a
// plain metadata CRUD resource. There is no generic PATCH/DELETE for an
// addon's own record: only `register` (create, status DRAFT), `prepare-
// upload`/`publish-version` (JS bundle, not modeled here — no UI for
// authoring/uploading a widget bundle exists yet), and the specific actions
// below (approve/reject/disable, default-config, enabled-by-default).
export type AdminAddon = {
  id: string;
  slug: string;
  scope: AdminAddonScope;
  status: AdminAddonStatus;
  name: string;
  description: string;
  authorName: string;
  categories: string[];
  iconUrl: string | null;
  currentVersion: string;
  bundleSizeBytes: number;
  moderationNote: string | null;
  /** Starting configJson every NEW install of this addon gets, across every
   * scope. Existing installs are untouched when this changes. */
  defaultConfigJson: unknown;
  /** Platform-wide "on by default": an APPROVED addon with this set renders
   * on its scope's surfaces even with no explicit install row. */
  enabledByDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

const MOCK_ADDONS: AdminAddon[] = [
  {
    id: 'addon-random-artist',
    slug: 'random-artist-week',
    scope: 'LISTENER',
    status: 'APPROVED',
    name: 'Random artist of the week',
    description: 'Highlights one artist from the community each week.',
    authorName: 'Tahti',
    categories: ['social', 'new-releases'],
    iconUrl: null,
    currentVersion: '1.0.0',
    bundleSizeBytes: 18400,
    moderationNote: null,
    defaultConfigJson: null,
    enabledByDefault: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'addon-channel-stats',
    slug: 'channel-stats',
    scope: 'ARTIST',
    status: 'APPROVED',
    name: 'Channel stats',
    description: 'Shows the artist channel’s current listener statistics.',
    authorName: 'Tahti',
    categories: ['stats'],
    iconUrl: null,
    currentVersion: '1.2.0',
    bundleSizeBytes: 22100,
    moderationNote: null,
    defaultConfigJson: null,
    enabledByDefault: true,
    createdAt: '2026-07-15T00:00:00.000Z',
    updatedAt: '2026-07-15T00:00:00.000Z',
  },
  {
    id: 'addon-pending-example',
    slug: 'pending-example',
    scope: 'LISTENER',
    status: 'PENDING',
    name: 'Now spinning ticker',
    description: 'Scrolling ticker of what every station is playing right now.',
    authorName: 'Community',
    categories: ['other'],
    iconUrl: null,
    currentVersion: '0.1.0',
    bundleSizeBytes: 4200,
    moderationNote: null,
    defaultConfigJson: null,
    enabledByDefault: false,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
];

let mockAddons = [...MOCK_ADDONS];

export async function fetchAdminAddons(
  scope?: AdminAddonScope,
  status?: AdminAddonStatus,
): Promise<{ data: AdminAddon[]; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockAddons.filter(
        (addon) =>
          (!scope || addon.scope === scope) &&
          (!status || addon.status === status),
      ),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const query = new URLSearchParams();
    if (scope) {
      query.set('scope', scope);
    }
    if (status) {
      query.set('status', status);
    }
    const suffix = query.size > 0 ? `?${query.toString()}` : '';
    const data = await getJson<{ widgets: AdminAddon[] }>(
      `/api/admin/addons${suffix}`,
    );
    return { data: data.widgets, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export type AdminAddonRegisterInput = {
  slug: string;
  scope: AdminAddonScope;
  name: string;
  description: string;
  authorName: string;
  categories: string[];
  iconUrl?: string;
};

export async function registerAdminAddon(
  input: AdminAddonRegisterInput,
): Promise<{ ok: true; data: AdminAddon } | { ok: false; error: string }> {
  if (isForceMock()) {
    const addon: AdminAddon = {
      id: `addon-${Date.now()}`,
      ...input,
      iconUrl: input.iconUrl || null,
      status: 'DRAFT',
      currentVersion: '0.0.0',
      bundleSizeBytes: 0,
      moderationNote: null,
      defaultConfigJson: null,
      enabledByDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockAddons = [addon, ...mockAddons];
    return { ok: true, data: addon };
  }
  try {
    const data = await sendJson<AdminAddon>('/api/admin/addons', 'POST', input);
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Registration failed',
    };
  }
}

function mockModerate(
  id: string,
  status: AdminAddonStatus,
  moderationNote: string | null,
): { ok: true; data: AdminAddon } | { ok: false; error: string } {
  const existing = mockAddons.find((addon) => addon.id === id);
  if (!existing) {
    return { ok: false, error: 'Add-on not found' };
  }
  const updated: AdminAddon = {
    ...existing,
    status,
    moderationNote,
    updatedAt: new Date().toISOString(),
  };
  mockAddons = mockAddons.map((addon) => (addon.id === id ? updated : addon));
  return { ok: true, data: updated };
}

export async function approveAdminAddon(
  id: string,
  moderationNote?: string,
): Promise<{ ok: true; data: AdminAddon } | { ok: false; error: string }> {
  if (isForceMock()) {
    return mockModerate(id, 'APPROVED', moderationNote ?? null);
  }
  try {
    const data = await sendJson<AdminAddon>(
      `/api/admin/addons/${encodeURIComponent(id)}/approve`,
      'POST',
      moderationNote ? { moderationNote } : {},
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Approve failed',
    };
  }
}

export async function rejectAdminAddon(
  id: string,
  moderationNote: string,
): Promise<{ ok: true; data: AdminAddon } | { ok: false; error: string }> {
  if (isForceMock()) {
    return mockModerate(id, 'REJECTED', moderationNote);
  }
  try {
    const data = await sendJson<AdminAddon>(
      `/api/admin/addons/${encodeURIComponent(id)}/reject`,
      'POST',
      { moderationNote },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Reject failed',
    };
  }
}

export async function disableAdminAddon(
  id: string,
  moderationNote?: string,
): Promise<{ ok: true; data: AdminAddon } | { ok: false; error: string }> {
  if (isForceMock()) {
    return mockModerate(id, 'DISABLED', moderationNote ?? null);
  }
  try {
    const data = await sendJson<AdminAddon>(
      `/api/admin/addons/${encodeURIComponent(id)}/disable`,
      'POST',
      moderationNote ? { moderationNote } : {},
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Disable failed',
    };
  }
}

export async function setAdminAddonEnabledByDefault(
  id: string,
  enabledByDefault: boolean,
): Promise<{ ok: true; data: AdminAddon } | { ok: false; error: string }> {
  if (isForceMock()) {
    const existing = mockAddons.find((addon) => addon.id === id);
    if (!existing) {
      return { ok: false, error: 'Add-on not found' };
    }
    const updated: AdminAddon = { ...existing, enabledByDefault };
    mockAddons = mockAddons.map((addon) => (addon.id === id ? updated : addon));
    return { ok: true, data: updated };
  }
  try {
    const data = await sendJson<AdminAddon>(
      `/api/admin/addons/${encodeURIComponent(id)}/enabled-by-default`,
      'POST',
      { enabledByDefault },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Update failed',
    };
  }
}

export async function setAdminAddonDefaultConfig(
  id: string,
  defaultConfigJson: Record<string, unknown> | null,
): Promise<{ ok: true; data: AdminAddon } | { ok: false; error: string }> {
  if (isForceMock()) {
    const existing = mockAddons.find((addon) => addon.id === id);
    if (!existing) {
      return { ok: false, error: 'Add-on not found' };
    }
    const updated: AdminAddon = { ...existing, defaultConfigJson };
    mockAddons = mockAddons.map((addon) => (addon.id === id ? updated : addon));
    return { ok: true, data: updated };
  }
  try {
    const data = await sendJson<AdminAddon>(
      `/api/admin/addons/${encodeURIComponent(id)}/default-config`,
      'POST',
      { defaultConfigJson },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Update failed',
    };
  }
}
