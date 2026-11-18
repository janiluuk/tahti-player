import type { FetchMeta } from '../client';
import { getJson, mutate, sendJson } from '../http';
import { failMeta, isForceMock } from '../mode';

// ── Beta applications ──────────────────────────────────────────────────────

export type AdminBetaStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AdminBetaApplication = {
  id: string;
  name: string;
  email: string;
  artistType: string;
  links: string | null;
  message: string | null;
  status: AdminBetaStatus;
  userId: string | null;
  username: string | null;
  hasPassword: boolean;
  setupUrl: string | null;
  createdAt: string;
};

function mockBetaApplications(): AdminBetaApplication[] {
  return [
    {
      id: 'beta-1',
      name: 'Kaiku Collective',
      email: 'hello@kaikucollective.fi',
      artistType: 'dj',
      links: 'https://soundcloud.com/kaikucollective',
      message:
        'Six of us trading a weekly slot, closing with a freestyle line.',
      status: 'PENDING',
      userId: null,
      username: null,
      hasPassword: false,
      setupUrl: null,
      createdAt: '2026-08-12T10:00:00.000Z',
    },
    {
      id: 'beta-2',
      name: 'Valo Radio',
      email: 'valo@tahti.example',
      artistType: 'radio',
      links: null,
      message: 'Monthly all-night synth streams out of Tampere.',
      status: 'APPROVED',
      userId: 'mock-valo',
      username: 'valo-radio',
      hasPassword: false,
      setupUrl: 'https://beta.tahti.live/setup-password?token=mock-valo',
      createdAt: '2026-08-08T09:00:00.000Z',
    },
    {
      id: 'beta-3',
      name: 'Static Bloom',
      email: 'static@example.com',
      artistType: 'band',
      links: null,
      message: null,
      status: 'REJECTED',
      userId: null,
      username: null,
      hasPassword: false,
      setupUrl: null,
      createdAt: '2026-08-01T09:00:00.000Z',
    },
  ];
}

export async function fetchAdminBetaApplications(
  status?: AdminBetaStatus,
): Promise<{ data: AdminBetaApplication[]; meta: FetchMeta }> {
  if (isForceMock()) {
    const all = mockBetaApplications();
    return {
      data: status ? all.filter((a) => a.status === status) : all,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const qs = new URLSearchParams({ limit: '100' });
    if (status) {
      qs.set('status', status);
    }
    const data = await getJson<{ applications: AdminBetaApplication[] }>(
      `/api/admin/beta/applications?${qs.toString()}`,
    );
    return { data: data.applications, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function approveBetaApplication(
  id: string,
  input: { username: string; displayName: string },
): Promise<
  { ok: true; setupUrl: string | null } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return {
      ok: true,
      setupUrl: `https://beta.tahti.live/setup-password?token=mock-${id}`,
    };
  }
  try {
    const res = await sendJson<{ setupUrl: string | null }>(
      `/api/admin/beta/applications/${encodeURIComponent(id)}/approve`,
      'POST',
      input,
    );
    return { ok: true, setupUrl: res.setupUrl };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed' };
  }
}

export async function rejectBetaApplication(id: string) {
  if (isForceMock()) {
    return { ok: true } as const;
  }
  return mutate(
    `/api/admin/beta/applications/${encodeURIComponent(id)}/reject`,
    'POST',
  );
}

export async function resendBetaSetupLink(
  id: string,
): Promise<
  { ok: true; setupUrl: string | null } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return {
      ok: true,
      setupUrl: `https://beta.tahti.live/setup-password?token=resent-${id}`,
    };
  }
  try {
    const res = await sendJson<{ setupUrl: string | null }>(
      `/api/admin/beta/applications/${encodeURIComponent(id)}/resend-setup`,
      'POST',
    );
    return { ok: true, setupUrl: res.setupUrl };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed' };
  }
}
