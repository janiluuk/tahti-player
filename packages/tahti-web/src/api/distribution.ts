import { allowMockFallback, apiErrorMeta, failMeta, isForceMock } from './mode';
import type {
  ReleaseCatalog,
  ReleaseCatalogPatch,
  ReleaseChecklistItem,
  ReleaseCredit,
  RevelatorBillingStatus,
  RevelatorCheckoutResponse,
  RevelatorReleaseStatus,
  RevelatorRoyaltyReportRow,
  RevelatorSubmitAccepted,
  SpotifyArtistProfile,
  SpotifyProfileStatus,
} from './studio-types';

const apiBase = () => {
  if (import.meta.env.VITE_TAHTI_API_URL?.startsWith('http')) {
    return import.meta.env.VITE_TAHTI_API_URL.replace(/\/$/, '');
  }
  return '/tahti-api';
};

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; status: number }> {
  const { headers: initHeaders, ...rest } = init ?? {};
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...initHeaders,
    },
  });
  if (!res.ok) {
    let detail = `${path} → ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body.error || body.message) {
        detail = body.error ?? body.message ?? detail;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return { data: (await res.json()) as T, status: res.status };
}

async function requestText(
  path: string,
): Promise<{ data: string; status: number }> {
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    let detail = `${path} → ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body.error || body.message) {
        detail = body.error ?? body.message ?? detail;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return { data: await res.text(), status: res.status };
}

// ── Mock fixtures ───────────────────────────────────────────────────────────

const mockBillingByRelease: Record<string, RevelatorBillingStatus> = {};
const mockStatusByRelease: Record<string, RevelatorReleaseStatus> = {};
const mockCatalogByRelease: Record<string, ReleaseCatalog> = {};
let mockSpotifyProfile: SpotifyArtistProfile | null = null;

function defaultChecklist(overrides?: {
  identifiers?: boolean;
  published?: boolean;
}): ReleaseChecklistItem[] {
  return [
    {
      id: 'metadata',
      label: 'Release metadata',
      done: true,
      hint: 'Title, date, description, artwork, and at least one track',
    },
    {
      id: 'identifiers',
      label: 'UPC / ISRC',
      done: overrides?.identifiers ?? false,
      hint: 'UPC on the release or ISRC on every track',
    },
    {
      id: 'musicbrainz',
      label: 'MusicBrainz',
      done: false,
      hint: 'Optional — store MBID after open-catalog submission',
    },
    {
      id: 'dsp',
      label: 'DSP / smart links',
      done: false,
      hint: 'Revelator submitted or platform URLs on the smart link',
    },
    {
      id: 'published',
      label: 'Published on profile',
      done: overrides?.published ?? true,
      hint: 'Release state is PUBLISHED',
    },
  ];
}

function mockBilling(releaseId: string): RevelatorBillingStatus {
  return (
    mockBillingByRelease[releaseId] ?? {
      paid: false,
      feeCents: 2900,
      waived: false,
      studioIncludedRemaining: 1,
      distributionPaidAt: null,
    }
  );
}

function mockStatus(
  releaseId: string,
  title = 'Mock release',
): RevelatorReleaseStatus {
  return (
    mockStatusByRelease[releaseId] ?? {
      revelatorId: null,
      revelatorStatus: null,
      title,
    }
  );
}

function mockCatalog(releaseId: string): ReleaseCatalog {
  return (
    mockCatalogByRelease[releaseId] ?? {
      id: releaseId,
      title: 'Mock EP',
      type: 'EP',
      state: 'PUBLISHED',
      releaseDate: '2026-01-01T00:00:00.000Z',
      description: 'Mock distribution release',
      artworkUrl: null,
      smartLinkSlug: 'mock-ep',
      smartLinkTargets: null,
      upc: null,
      musicbrainzReleaseId: null,
      musicbrainzArtistId: null,
      discogsReleaseId: null,
      pLine: null,
      cLine: null,
      labelImprint: null,
      credits: [],
      revelatorId: null,
      revelatorStatus: null,
      tracks: [
        {
          id: 't1',
          position: 1,
          title: 'Track one',
          isrc: null,
          durationSec: 210,
        },
      ],
      checklist: defaultChecklist(),
    }
  );
}

function mockRoyalties(): RevelatorRoyaltyReportRow[] {
  return [
    {
      id: 'roy-1',
      releaseId: 'rel-mock',
      releaseTitle: 'Mock EP',
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
      amountCents: 4210,
      currency: 'EUR',
      streams: 18422,
      syncedAt: '2026-07-05T09:00:00.000Z',
    },
    {
      id: 'roy-2',
      releaseId: 'rel-mock',
      releaseTitle: 'Mock EP',
      periodStart: '2026-05-01',
      periodEnd: '2026-05-31',
      amountCents: 3190,
      currency: 'EUR',
      streams: 13977,
      syncedAt: '2026-06-04T09:00:00.000Z',
    },
  ];
}

function recomputeMockChecklist(
  catalog: ReleaseCatalog,
): ReleaseChecklistItem[] {
  const identifiersDone =
    Boolean(catalog.upc?.trim()) ||
    (catalog.tracks.length > 0 &&
      catalog.tracks.every((t) => Boolean(t.isrc?.trim())));
  const musicbrainzDone = Boolean(catalog.musicbrainzReleaseId?.trim());
  const dspDone =
    catalog.revelatorStatus === 'delivered' ||
    catalog.revelatorStatus === 'submitted' ||
    catalog.revelatorStatus === 'pending' ||
    Boolean(
      catalog.smartLinkTargets &&
      Object.keys(catalog.smartLinkTargets).length > 0,
    );
  return defaultChecklist({
    identifiers: identifiersDone,
    published: catalog.state === 'PUBLISHED',
  }).map((step) => {
    if (step.id === 'musicbrainz') {
      return { ...step, done: musicbrainzDone };
    }
    if (step.id === 'dsp') {
      return { ...step, done: dspDone };
    }
    return step;
  });
}

// ── API ──────────────────────────────────────────────────────────────────────

export async function fetchRevelatorStatus(releaseId: string): Promise<{
  data: RevelatorReleaseStatus | null;
  meta: { source: 'api' | 'mock'; reason?: string };
}> {
  if (isForceMock()) {
    return {
      data: mockStatus(releaseId),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<RevelatorReleaseStatus>(
      `/api/me/releases/${encodeURIComponent(releaseId)}/revelator`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockStatus(releaseId), meta: failMeta(err) };
    }
    return { data: null, meta: apiErrorMeta(err) };
  }
}

export async function fetchRevelatorBilling(releaseId: string): Promise<{
  data: RevelatorBillingStatus | null;
  meta: { source: 'api' | 'mock'; reason?: string };
}> {
  if (isForceMock()) {
    return {
      data: mockBilling(releaseId),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<RevelatorBillingStatus>(
      `/api/me/releases/${encodeURIComponent(releaseId)}/revelator/billing`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockBilling(releaseId), meta: failMeta(err) };
    }
    return { data: null, meta: apiErrorMeta(err) };
  }
}

export async function startRevelatorCheckout(
  releaseId: string,
): Promise<
  { ok: true; data: RevelatorCheckoutResponse } | { ok: false; error: string }
> {
  if (isForceMock()) {
    mockBillingByRelease[releaseId] = {
      ...mockBilling(releaseId),
      paid: true,
      distributionPaidAt: new Date().toISOString(),
    };
    return {
      ok: true,
      data: {
        paid: true,
        feeCents: mockBilling(releaseId).feeCents,
        waived: false,
      },
    };
  }
  try {
    const { data } = await requestJson<RevelatorCheckoutResponse>(
      `/api/me/releases/${encodeURIComponent(releaseId)}/revelator/checkout`,
      { method: 'POST' },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Checkout failed',
    };
  }
}

export async function submitToRevelator(
  releaseId: string,
): Promise<
  { ok: true; data: RevelatorSubmitAccepted } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const billing = mockBilling(releaseId);
    if (!billing.paid) {
      return {
        ok: false,
        error: 'Pay the distribution fee before submitting to Revelator',
      };
    }
    const catalog = mockCatalog(releaseId);
    const hasIdentifier =
      Boolean(catalog.upc?.trim()) ||
      catalog.tracks.every((t) => Boolean(t.isrc?.trim()));
    if (!hasIdentifier) {
      return {
        ok: false,
        error: 'Add a UPC or ISRC on every track before DSP submit',
      };
    }
    mockStatusByRelease[releaseId] = {
      ...mockStatus(releaseId),
      revelatorStatus: 'pending',
    };
    mockCatalogByRelease[releaseId] = {
      ...catalog,
      revelatorStatus: 'pending',
      checklist: recomputeMockChecklist({
        ...catalog,
        revelatorStatus: 'pending',
      }),
    };
    return { ok: true, data: { releaseId, revelatorStatus: 'pending' } };
  }
  try {
    const { data } = await requestJson<RevelatorSubmitAccepted>(
      `/api/me/releases/${encodeURIComponent(releaseId)}/revelator/submit`,
      { method: 'POST' },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Submit failed',
    };
  }
}

/** Prod-style: settle fee (or Stripe redirect), then queue Revelator deliver. */
export async function payAndSubmitToRevelator(
  releaseId: string,
): Promise<
  | { ok: true; data: RevelatorSubmitAccepted }
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string }
> {
  const checkout = await startRevelatorCheckout(releaseId);
  if (!checkout.ok) {
    return checkout;
  }
  if ('checkoutUrl' in checkout.data) {
    return { ok: true, checkoutUrl: checkout.data.checkoutUrl };
  }
  return submitToRevelator(releaseId);
}

export async function fetchReleaseRoyalties(releaseId: string): Promise<{
  data: RevelatorRoyaltyReportRow[];
  meta: { source: 'api' | 'mock'; reason?: string };
}> {
  if (isForceMock()) {
    return {
      data: mockRoyalties().map((r) => ({ ...r, releaseId })),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{
      reports: RevelatorRoyaltyReportRow[];
    }>(`/api/me/releases/${encodeURIComponent(releaseId)}/revelator/royalties`);
    return { data: data.reports, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockRoyalties(), meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function fetchAllRoyalties(): Promise<{
  data: RevelatorRoyaltyReportRow[];
  meta: { source: 'api' | 'mock'; reason?: string };
}> {
  if (isForceMock()) {
    return {
      data: mockRoyalties(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{
      reports: RevelatorRoyaltyReportRow[];
    }>('/api/me/revelator/royalties');
    return { data: data.reports ?? [], meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockRoyalties(), meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function fetchReleaseCatalog(releaseId: string): Promise<{
  data: ReleaseCatalog | null;
  meta: { source: 'api' | 'mock'; reason?: string };
}> {
  if (isForceMock()) {
    return {
      data: mockCatalog(releaseId),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ReleaseCatalog>(
      `/api/me/releases/${encodeURIComponent(releaseId)}/catalog`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockCatalog(releaseId), meta: failMeta(err) };
    }
    return { data: null, meta: apiErrorMeta(err) };
  }
}

export async function patchReleaseCatalog(
  releaseId: string,
  patch: ReleaseCatalogPatch,
): Promise<{ ok: true; data: ReleaseCatalog } | { ok: false; error: string }> {
  if (isForceMock()) {
    const prev = mockCatalog(releaseId);
    const next: ReleaseCatalog = {
      ...prev,
      ...patch,
      credits: patch.credits ?? prev.credits,
    };
    next.checklist = recomputeMockChecklist(next);
    mockCatalogByRelease[releaseId] = next;
    return { ok: true, data: next };
  }
  try {
    const { data } = await requestJson<ReleaseCatalog>(
      `/api/me/releases/${encodeURIComponent(releaseId)}/catalog`,
      { method: 'PATCH', body: JSON.stringify(patch) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to save catalog',
    };
  }
}

export async function fetchReleaseExportJson(
  releaseId: string,
): Promise<{ ok: true; json: string } | { ok: false; error: string }> {
  if (isForceMock()) {
    const catalog = mockCatalog(releaseId);
    const pack = {
      exportedAt: new Date().toISOString(),
      musicbrainzPrefill: `=== Tahti → MusicBrainz prefill ===\nRelease title: ${catalog.title}\nBarcode (UPC/EAN): ${catalog.upc ?? ''}\nSubmit: https://musicbrainz.org/release/add`,
      discogsPrefill: `=== Tahti → Discogs prefill ===\nTitle: ${catalog.title}\nBarcode: ${catalog.upc ?? ''}\nSearch Discogs first to avoid duplicates: https://www.discogs.com/search/`,
      musicbrainzSubmitUrl: 'https://musicbrainz.org/release/add',
      discogsSubmitUrl: 'https://www.discogs.com/search/',
      release: {
        title: catalog.title,
        upc: catalog.upc,
        smartLinkSlug: catalog.smartLinkSlug,
      },
      tracks: catalog.tracks,
    };
    return { ok: true, json: JSON.stringify(pack, null, 2) };
  }
  try {
    const { data } = await requestText(
      `/api/me/releases/${encodeURIComponent(releaseId)}/export.json`,
    );
    return { ok: true, json: data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Export failed',
    };
  }
}

export async function fetchSpotifyArtistProfile(): Promise<{
  data: SpotifyProfileStatus;
  meta: { source: 'api' | 'mock'; reason?: string };
}> {
  if (isForceMock()) {
    return {
      data: { configured: true, profile: mockSpotifyProfile },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<SpotifyProfileStatus>(
      '/api/me/spotify-profile',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return {
        data: { configured: true, profile: mockSpotifyProfile },
        meta: failMeta(err),
      };
    }
    return {
      data: { configured: false, profile: null },
      meta: apiErrorMeta(err),
    };
  }
}

export async function linkSpotifyArtistProfile(
  artistUrl: string,
): Promise<
  { ok: true; data: SpotifyProfileStatus } | { ok: false; error: string }
> {
  if (isForceMock()) {
    mockSpotifyProfile = {
      artistId: 'mock-artist',
      name: 'Mock Artist',
      imageUrl: null,
    };
    return {
      ok: true,
      data: { configured: true, profile: mockSpotifyProfile },
    };
  }
  try {
    const { data } = await requestJson<SpotifyProfileStatus>(
      '/api/me/spotify-profile',
      { method: 'PUT', body: JSON.stringify({ artistUrl }) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Link failed',
    };
  }
}

export async function unlinkSpotifyArtistProfile(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (isForceMock()) {
    mockSpotifyProfile = null;
    return { ok: true };
  }
  try {
    await requestJson('/api/me/spotify-profile', { method: 'DELETE' });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unlink failed',
    };
  }
}

export function parseCredits(value: unknown): ReleaseCredit[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const roles = new Set([
    'writer',
    'composer',
    'performer',
    'producer',
    'remixer',
    'engineer',
    'label',
  ]);
  return value.filter(
    (row): row is ReleaseCredit =>
      Boolean(row) &&
      typeof row === 'object' &&
      typeof (row as ReleaseCredit).name === 'string' &&
      roles.has((row as ReleaseCredit).role),
  );
}
