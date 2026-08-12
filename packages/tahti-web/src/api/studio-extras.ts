import type { FetchMeta } from './client';
import { allowMockFallback, apiErrorMeta } from './mode';

const forceMock = () => import.meta.env.VITE_FORCE_MOCK === '1';

const apiBase = () => {
  if (import.meta.env.VITE_TAHTI_API_URL?.startsWith('http')) {
    return import.meta.env.VITE_TAHTI_API_URL.replace(/\/$/, '');
  }
  return '/tahti-api';
};

function failMeta(err: unknown): FetchMeta {
  return {
    source: 'mock',
    reason: err instanceof Error ? err.message : 'fetch failed',
  };
}

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
  if (res.status === 204) {
    return { data: undefined as T, status: res.status };
  }
  return { data: (await res.json()) as T, status: res.status };
}

// ── Schedule ────────────────────────────────────────────────────────────────

export type ChannelSchedule = {
  nextBroadcastAt: string | null;
  nextBroadcastNote: string | null;
};

export type ProgrammeItem = {
  id: string;
  title: string;
  status: string;
  durationSec: number | null;
  isFallback: boolean;
  fallbackOrder: number | null;
};

export type ProgrammeView = {
  fallbackMode: 'shuffle' | 'ordered';
  fallbackEnabled: boolean;
  fallbackAutoEnroll: boolean;
  announcementsEnabled: boolean;
  items: ProgrammeItem[];
};

let mockSchedule: ChannelSchedule = {
  nextBroadcastAt: new Date(Date.now() + 3 * 24 * 3600_000).toISOString(),
  nextBroadcastNote: 'Mock Friday set',
};

let mockProgramme: ProgrammeView = {
  fallbackMode: 'shuffle',
  fallbackEnabled: true,
  fallbackAutoEnroll: true,
  announcementsEnabled: true,
  items: [
    {
      id: 'arch-mock-1',
      title: 'Northern Lights — Live Set',
      status: 'READY',
      durationSec: 3720,
      isFallback: true,
      fallbackOrder: 0,
    },
  ],
};

export async function fetchChannelSchedule(): Promise<{
  data: ChannelSchedule;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: { ...mockSchedule },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ChannelSchedule>(
      '/api/me/channel/schedule',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { nextBroadcastAt: null, nextBroadcastNote: null },
      meta: failMeta(err),
    };
  }
}

export async function patchChannelSchedule(
  patch: Partial<ChannelSchedule>,
): Promise<{ ok: true; data: ChannelSchedule } | { ok: false; error: string }> {
  if (forceMock()) {
    mockSchedule = { ...mockSchedule, ...patch };
    return { ok: true, data: { ...mockSchedule } };
  }
  try {
    const { data } = await requestJson<ChannelSchedule>(
      '/api/me/channel/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

export async function fetchProgramme(): Promise<{
  data: ProgrammeView;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: { ...mockProgramme, items: [...mockProgramme.items] },
      meta: { source: 'mock' },
    };
  }
  try {
    const { data } = await requestJson<ProgrammeView>(
      '/api/me/channel/programme',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: {
        fallbackMode: 'shuffle',
        fallbackEnabled: false,
        fallbackAutoEnroll: false,
        announcementsEnabled: false,
        items: [],
      },
      meta: failMeta(err),
    };
  }
}

export async function patchProgramme(
  patch: Partial<
    Pick<
      ProgrammeView,
      | 'fallbackMode'
      | 'fallbackEnabled'
      | 'fallbackAutoEnroll'
      | 'announcementsEnabled'
    >
  >,
): Promise<{ ok: true; data: ProgrammeView } | { ok: false; error: string }> {
  if (forceMock()) {
    mockProgramme = { ...mockProgramme, ...patch };
    return {
      ok: true,
      data: { ...mockProgramme, items: [...mockProgramme.items] },
    };
  }
  try {
    const { data } = await requestJson<ProgrammeView>(
      '/api/me/channel/programme',
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

// ── Stats ───────────────────────────────────────────────────────────────────

export type StatsSummary = {
  playsToday: number;
  playsTotal: number;
  downloadsToday: number;
  downloadsTotal: number;
};

export type StatsTopTrack = {
  archiveItemId: string;
  title: string;
  plays: number;
};
export type StatsTopCountry = { country: string; count: number };

export async function fetchStatsSummary(): Promise<{
  data: StatsSummary;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: {
        playsToday: 42,
        playsTotal: 12890,
        downloadsToday: 3,
        downloadsTotal: 910,
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StatsSummary>('/api/me/stats/summary');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: {
        playsToday: 0,
        playsTotal: 0,
        downloadsToday: 0,
        downloadsTotal: 0,
      },
      meta: failMeta(err),
    };
  }
}

export async function fetchStatsTopTracks(): Promise<{
  data: StatsTopTrack[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: [
        {
          archiveItemId: 'arch-mock-1',
          title: 'Northern Lights — Live Set',
          plays: 420,
        },
        { archiveItemId: 'arch-mock-2', title: 'Studio sketch A', plays: 88 },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ items: StatsTopTrack[] }>(
      '/api/me/stats/top-tracks?range=30',
    );
    return { data: data.items ?? [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function fetchStatsTopCountries(): Promise<{
  data: StatsTopCountry[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: [
        { country: 'FI', count: 120 },
        { country: 'DE', count: 45 },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ items: StatsTopCountry[] }>(
      '/api/me/stats/top-countries?range=30',
    );
    return { data: data.items ?? [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}


export type StatsPlaysRange = '7' | '30' | 'all';

export type StatsPlaysDaily = {
  date: string;
  plays: number;
  downloads?: number;
  smartLinkClicks?: number;
};

export type StatsPlays = {
  range: StatsPlaysRange;
  totalPlays: number;
  totalDownloads: number;
  totalSmartLinkClicks?: number;
  daily: StatsPlaysDaily[];
  downloadCountries?: Array<{
    countryCode: string;
    displayName: string;
    count: number;
  }>;
};

function mockPlays(range: StatsPlaysRange): StatsPlays {
  const days = range === '7' ? 7 : range === '30' ? 30 : 14;
  const daily: StatsPlaysDaily[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000);
    daily.push({
      date: d.toISOString().slice(0, 10),
      plays: Math.round(8 + Math.random() * 40),
      downloads: Math.round(Math.random() * 5),
    });
  }
  return {
    range,
    totalPlays: daily.reduce((a, b) => a + b.plays, 0),
    totalDownloads: daily.reduce((a, b) => a + (b.downloads ?? 0), 0),
    totalSmartLinkClicks: 12,
    daily,
    downloadCountries: [
      { countryCode: 'FI', displayName: 'Finland', count: 40 },
      { countryCode: 'DE', displayName: 'Germany', count: 18 },
    ],
  };
}

export async function fetchStatsPlays(
  range: StatsPlaysRange = '30',
): Promise<{ data: StatsPlays; meta: FetchMeta }> {
  if (forceMock()) {
    return {
      data: mockPlays(range),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StatsPlays>(
      `/api/me/stats/plays?range=${range}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockPlays(range), meta: failMeta(err) };
    }
    return {
      data: {
        range,
        totalPlays: 0,
        totalDownloads: 0,
        daily: [],
        downloadCountries: [],
      },
      meta: apiErrorMeta(err),
    };
  }
}

// ── Profile / channel settings lite ─────────────────────────────────────────

export type ProfileFields = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  tipJarUrl: string | null;
  pronouns: string | null;
  chatEnabled: boolean;
  artistKind?: 'SINGLE' | 'COLLECTIVE';
};

let mockProfile: ProfileFields = {
  id: 'user-mock',
  username: 'demo',
  displayName: 'Demo Artist',
  bio: 'Mock bio for Nuclear studio channel settings.',
  tipJarUrl: null,
  pronouns: null,
  chatEnabled: true,
  artistKind: 'SINGLE',
};

export async function fetchMeProfile(): Promise<{
  data: ProfileFields;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: { ...mockProfile },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ProfileFields>('/api/me/profile');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { ...mockProfile, username: 'unknown' },
      meta: failMeta(err),
    };
  }
}

export async function patchMeProfile(
  patch: Partial<
    Pick<
      ProfileFields,
      'displayName' | 'bio' | 'tipJarUrl' | 'pronouns' | 'chatEnabled'
    >
  >,
): Promise<{ ok: true; data: ProfileFields } | { ok: false; error: string }> {
  if (forceMock()) {
    mockProfile = { ...mockProfile, ...patch };
    return { ok: true, data: { ...mockProfile } };
  }
  try {
    const { data } = await requestJson<ProfileFields>('/api/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

// ── Posts + newsletter ──────────────────────────────────────────────────────

export type ArtistPost = {
  id: string;
  title: string | null;
  body: string;
  linkUrl: string | null;
  linkLabel: string | null;
  publishAt: string;
  createdAt: string;
};

export type NewsletterDraft = {
  id: string;
  subject: string;
  bodyMd?: string;
  state?: string;
  subscribersOnly?: boolean;
  createdAt?: string;
  sentAt?: string | null;
};

let mockPosts: ArtistPost[] = [
  {
    id: 'post-mock-1',
    title: 'New set up',
    body: 'Archive just dropped — listen on the channel.',
    linkUrl: null,
    linkLabel: null,
    publishAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

let mockDrafts: NewsletterDraft[] = [
  {
    id: 'nl-mock-1',
    subject: 'This week on the channel',
    bodyMd: 'Thanks for tuning in.',
    state: 'DRAFT',
    subscribersOnly: false,
    createdAt: new Date().toISOString(),
    sentAt: null,
  },
];

export async function fetchArtistPosts(): Promise<{
  data: ArtistPost[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: [...mockPosts],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ArtistPost[]>('/api/me/posts');
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function createArtistPost(input: {
  title?: string;
  body: string;
  linkUrl?: string;
}): Promise<{ ok: true; data: ArtistPost } | { ok: false; error: string }> {
  if (forceMock()) {
    const row: ArtistPost = {
      id: `post-mock-${Date.now()}`,
      title: input.title ?? null,
      body: input.body,
      linkUrl: input.linkUrl ?? null,
      linkLabel: null,
      publishAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    mockPosts = [row, ...mockPosts];
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<ArtistPost>('/api/me/posts', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Create failed',
    };
  }
}

export async function deleteArtistPost(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    mockPosts = mockPosts.filter((p) => p.id !== id);
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/posts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Delete failed',
    };
  }
}

export async function fetchNewsletterDrafts(): Promise<{
  data: NewsletterDraft[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: [...mockDrafts],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<
      | NewsletterDraft[]
      | { drafts: NewsletterDraft[]; page?: number; total?: number }
    >('/api/me/newsletter/drafts?page=1&limit=50');
    const list = Array.isArray(data) ? data : (data.drafts ?? []);
    return { data: list, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function sendNewsletterDraft(
  draftId: string,
  audience?: 'all' | 'fans',
): Promise<{ ok: true; queued?: number } | { ok: false; error: string }> {
  if (forceMock()) {
    mockDrafts = mockDrafts.map((d) =>
      d.id === draftId
        ? { ...d, state: 'SENT', sentAt: new Date().toISOString() }
        : d,
    );
    return { ok: true, queued: 3 };
  }
  try {
    const { data } = await requestJson<{ queued?: number; ok?: boolean }>(
      `/api/me/newsletter/send/${encodeURIComponent(draftId)}`,
      { method: 'POST', body: JSON.stringify({ audience }) },
    );
    return { ok: true, queued: data.queued };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Send failed',
    };
  }
}

export async function createNewsletterDraft(input: {
  subject: string;
  bodyMd: string;
  subscribersOnly?: boolean;
}): Promise<
  { ok: true; data: NewsletterDraft } | { ok: false; error: string }
> {
  if (forceMock()) {
    const row: NewsletterDraft = {
      id: `nl-mock-${Date.now()}`,
      subject: input.subject,
      bodyMd: input.bodyMd,
      state: 'DRAFT',
      subscribersOnly: input.subscribersOnly ?? false,
      createdAt: new Date().toISOString(),
      sentAt: null,
    };
    mockDrafts = [row, ...mockDrafts];
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<NewsletterDraft>(
      '/api/me/newsletter/drafts',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Create failed',
    };
  }
}

/** Fire-and-forget emoji reaction (no auth required on Tahti). */
export async function postChatReaction(
  slug: string,
  emoji: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    return { ok: true };
  }
  try {
    await requestJson(`/api/chat/${encodeURIComponent(slug)}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'React failed',
    };
  }
}
