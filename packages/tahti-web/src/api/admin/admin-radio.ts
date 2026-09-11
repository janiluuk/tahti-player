import type { FetchMeta } from '../client';
import { getJson, mutate, sendJson } from '../http';
import {
  createMockInternetRadioPreset,
  deleteMockInternetRadioPreset,
  listMockInternetRadioPresets,
  patchMockInternetRadioPreset,
} from '../internetRadioPresetsMockStore';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
} from '../mode';

// ── Radio ops ───────────────────────────────────────────────────────────────

export type AdminRadioChannel = {
  channelId: string;
  slug: string;
  artistName: string;
  lastFeaturedAt: string | null;
};

export type AdminRadioHistoryItem = {
  channelId: string;
  slug: string;
  artistName: string;
  featuredAt: string;
};

export type AdminRadioOptedOut = {
  channelId: string;
  slug: string;
  artistName: string;
  isLive: boolean;
};

export type AdminRadioData = {
  nowPlaying: { live: boolean; slug: string | null; artistName: string | null };
  eligible: AdminRadioChannel[];
  history: AdminRadioHistoryItem[];
  optedOut: AdminRadioOptedOut[];
};

export type AdminRadioRotationItem = {
  id: string;
  title: string;
  artistName: string;
  durationSec: number | null;
  soundId: string;
  audioUrl?: string | null;
  channelSlug: string;
  license: string;
  addedBy: string;
};

const mockRadioRotation: AdminRadioRotationItem[] = [
  {
    id: 'radio-rotation-1',
    soundId: 'radio-archive-1',
    title: 'Night Transit',
    artistName: 'Tahti Radio submissions',
    durationSec: 288,
    channelSlug: 'tahti-radio',
    license: 'CC_BY',
    addedBy: 'radio-editorial',
  },
  {
    id: 'radio-rotation-2',
    soundId: 'radio-archive-2',
    title: 'Signal Bloom',
    artistName: 'Tahti Radio submissions',
    durationSec: 346,
    channelSlug: 'tahti-radio',
    license: 'CC_BY_SA',
    addedBy: 'radio-editorial',
  },
];

export async function fetchAdminRadioRotation(): Promise<{
  data: AdminRadioRotationItem[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockRadioRotation,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<
      Array<{
        id: string;
        title: string;
        artistName: string;
        durationSec?: number | null;
        artistUsername?: string | null;
      }>
    >('/api/v1/radio/rotation');
    return {
      data: data.map((item) => ({
        ...item,
        soundId: item.id,
        durationSec: item.durationSec ?? null,
        channelSlug: item.artistUsername ?? 'tahti-radio',
        license: '',
        addedBy: 'radio-editorial',
      })),
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

function mockRadioAdmin(): AdminRadioData {
  return {
    nowPlaying: {
      live: false,
      slug: null,
      artistName: null,
    },
    eligible: [
      {
        channelId: 'c1',
        slug: 'northern-lights',
        artistName: 'Northern Lights',
        lastFeaturedAt: '2026-08-16T20:00:00.000Z',
      },
      {
        channelId: 'c2',
        slug: 'dj-moonlight',
        artistName: 'DJ Moonlight',
        lastFeaturedAt: null,
      },
    ],
    history: [
      {
        channelId: 'c3',
        slug: 'kaiku-collective',
        artistName: 'Kaiku Collective',
        featuredAt: '2026-08-16T14:00:00.000Z',
      },
      {
        channelId: 'c1',
        slug: 'northern-lights',
        artistName: 'Northern Lights',
        featuredAt: '2026-08-15T21:00:00.000Z',
      },
    ],
    optedOut: [
      {
        channelId: 'c4',
        slug: 'tundra-static',
        artistName: 'Tundra Static',
        isLive: false,
      },
    ],
  };
}

export async function fetchAdminRadio(): Promise<{
  data: AdminRadioData;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockRadioAdmin(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{
      nowPlaying: {
        live: boolean;
        channel: { slug: string; artistName: string } | null;
      };
      eligible: AdminRadioChannel[];
      history: AdminRadioHistoryItem[];
      optedOut: AdminRadioOptedOut[];
    }>('/api/admin/radio');
    return {
      data: {
        nowPlaying: {
          live: data.nowPlaying.live,
          slug: data.nowPlaying.channel?.slug ?? null,
          artistName: data.nowPlaying.channel?.artistName ?? null,
        },
        eligible: data.eligible,
        history: data.history,
        optedOut: data.optedOut,
      },
      meta: { source: 'api' },
    };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockRadioAdmin(), meta: failMeta(err) };
    }
    return {
      data: {
        nowPlaying: { live: false, slug: null, artistName: null },
        eligible: [],
        history: [],
        optedOut: [],
      },
      meta: apiErrorMeta(err),
    };
  }
}

export function radioMoveToFront(channelId: string) {
  if (isForceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/radio/${encodeURIComponent(channelId)}/reset-rotation`,
    'POST',
  );
}

export function radioOptOut(channelId: string) {
  if (isForceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/radio/${encodeURIComponent(channelId)}/opt-out`,
    'POST',
  );
}

export function radioRemoveOptOut(channelId: string) {
  if (isForceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/radio/${encodeURIComponent(channelId)}/opt-out`,
    'DELETE',
  );
}

// ── Internet radio presets (Listen page defaults) ───────────────────────────

export type AdminInternetRadioPreset = {
  id: string;
  name: string;
  genre: string | null;
  description: string | null;
  iconUrl: string | null;
  programmingUrl: string | null;
  streamUrl: string | null;
  enabled: boolean;
};

export type AdminInternetRadioPresetInput = {
  name: string;
  genre?: string;
  description?: string;
  iconUrl?: string;
  programmingUrl?: string;
  streamUrl?: string;
  enabled?: boolean;
};

export async function fetchAdminInternetRadioPresets(): Promise<{
  data: AdminInternetRadioPreset[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: listMockInternetRadioPresets(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ presets: AdminInternetRadioPreset[] }>(
      '/api/admin/internet-radio-presets',
    );
    return { data: data.presets, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function createAdminInternetRadioPreset(
  input: AdminInternetRadioPresetInput,
): Promise<
  { ok: true; data: AdminInternetRadioPreset } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const preset = createMockInternetRadioPreset({
      genre: null,
      description: null,
      iconUrl: null,
      programmingUrl: null,
      streamUrl: null,
      ...input,
    });
    return { ok: true, data: preset };
  }
  try {
    const data = await sendJson<AdminInternetRadioPreset>(
      '/api/admin/internet-radio-presets',
      'POST',
      input,
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Create failed',
    };
  }
}

export async function patchAdminInternetRadioPreset(
  id: string,
  patch: Partial<AdminInternetRadioPresetInput>,
): Promise<
  { ok: true; data: AdminInternetRadioPreset } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const updated = patchMockInternetRadioPreset(id, patch);
    if (!updated) {
      return { ok: false, error: 'Preset not found' };
    }
    return { ok: true, data: updated };
  }
  try {
    const data = await sendJson<AdminInternetRadioPreset>(
      `/api/admin/internet-radio-presets/${encodeURIComponent(id)}`,
      'PATCH',
      patch,
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Update failed',
    };
  }
}

export async function deleteAdminInternetRadioPreset(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    deleteMockInternetRadioPreset(id);
    return { ok: true };
  }
  return mutate(
    `/api/admin/internet-radio-presets/${encodeURIComponent(id)}`,
    'DELETE',
  );
}

// ── Radio submissions ───────────────────────────────────────────────────────

export type AdminRadioSubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AdminRadioSubmission = {
  id: string;
  status: AdminRadioSubmissionStatus;
  rejectionNote: string | null;
  createdAt: string;
  submitter: { username: string; displayName: string } | null;
  sound: {
    id: string;
    title: string;
    artistName: string | null;
    durationSec: number | null;
    bannerUrl: string | null;
    audioUrl: string | null;
  };
};

function mockRadioSubmissions(): AdminRadioSubmission[] {
  return [
    {
      id: 'sub-1',
      status: 'PENDING',
      rejectionNote: null,
      createdAt: '2026-08-16T12:00:00.000Z',
      submitter: { username: 'dj-moonlight', displayName: 'DJ Moonlight' },
      sound: {
        id: 'arch-sub-1',
        title: 'Moonlight Drive',
        artistName: 'DJ Moonlight',
        durationSec: 312,
        bannerUrl: '/mock/dj-moonlight/cover-moonlight-drive.svg',
        audioUrl:
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      },
    },
    {
      id: 'sub-2',
      status: 'PENDING',
      rejectionNote: null,
      createdAt: '2026-08-15T09:30:00.000Z',
      submitter: {
        username: 'kaiku-collective',
        displayName: 'Kaiku Collective',
      },
      sound: {
        id: 'arch-sub-2',
        title: 'Echo Chamber Cypher',
        artistName: 'Kaiku Collective',
        durationSec: 254,
        bannerUrl: null,
        audioUrl:
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      },
    },
  ];
}

export async function fetchAdminRadioSubmissions(): Promise<{
  data: AdminRadioSubmission[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockRadioSubmissions(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{
      items?: AdminRadioSubmission[];
      submissions?: AdminRadioSubmission[];
    }>('/api/admin/radio-submissions?status=PENDING');
    return {
      data: data.items ?? data.submissions ?? [],
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function fetchAdminRadioSubmissionAudio(id: string): Promise<
  | {
      ok: true;
      data: {
        audioUrl: string;
        title: string;
        artistName: string;
        soundId: string;
      };
    }
  | { ok: false; error: string }
> {
  if (isForceMock()) {
    const row = mockRadioSubmissions().find((item) => item.id === id);
    if (!row?.sound.audioUrl) {
      return { ok: false, error: 'No playable audio' };
    }
    return {
      ok: true,
      data: {
        audioUrl: row.sound.audioUrl,
        title: row.sound.title,
        artistName: row.sound.artistName ?? row.submitter?.displayName ?? '',
        soundId: row.sound.id,
      },
    };
  }
  try {
    const data = await getJson<{
      audioUrl: string;
      title: string;
      artistName: string;
      soundId: string;
    }>(`/api/admin/radio-submissions/${encodeURIComponent(id)}/audio`);
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Audio could not be loaded',
    };
  }
}

export function approveRadioSubmission(id: string) {
  if (isForceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/radio-submissions/${encodeURIComponent(id)}/approve`,
    'POST',
  );
}

export function rejectRadioSubmission(id: string, note?: string) {
  if (isForceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/radio-submissions/${encodeURIComponent(id)}/reject`,
    'POST',
    note ? { note } : undefined,
  );
}

// ── Internet radio station suggestions ──────────────────────────────────────
// Listener-submitted *external* internet radio stations (Store & forward
// widget), not to be confused with AdminRadioSubmission above, which audits
// tracks submitted for Tahti's own co-op radio rotation.

export type AdminRadioStationSuggestionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export type AdminRadioStationSuggestion = {
  id: string;
  status: AdminRadioStationSuggestionStatus;
  rejectionNote: string | null;
  createdAt: string;
  submitter: { username: string; displayName: string } | null;
  name: string;
  logoUrl: string | null;
  language: string;
  bitrateKbps: number | null;
  streamUrl: string;
};

function mockRadioStationSuggestions(): AdminRadioStationSuggestion[] {
  return [
    {
      id: 'station-sug-1',
      status: 'PENDING',
      rejectionNote: null,
      createdAt: '2026-08-20T10:00:00.000Z',
      submitter: {
        username: 'kaiku-collective',
        displayName: 'Kaiku Collective',
      },
      name: 'Basso FM',
      logoUrl: null,
      language: 'Finnish',
      bitrateKbps: 128,
      streamUrl: 'https://stream.example.fi/basso-fm.mp3',
    },
    {
      id: 'station-sug-2',
      status: 'PENDING',
      rejectionNote: null,
      createdAt: '2026-08-18T14:30:00.000Z',
      submitter: { username: 'valo-radio', displayName: 'Valo Radio' },
      name: 'Lumo Radio',
      logoUrl: null,
      language: 'Finnish',
      bitrateKbps: 192,
      streamUrl: 'https://stream.example.fi/lumo-radio.aac',
    },
  ];
}

export async function fetchAdminRadioStationSuggestions(): Promise<{
  data: AdminRadioStationSuggestion[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockRadioStationSuggestions(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ items?: AdminRadioStationSuggestion[] }>(
      '/api/admin/radio-station-suggestions?status=PENDING',
    );
    return { data: data.items ?? [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export function approveRadioStationSuggestion(id: string) {
  if (isForceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/radio-station-suggestions/${encodeURIComponent(id)}/approve`,
    'POST',
  );
}

export function rejectRadioStationSuggestion(id: string, note?: string) {
  if (isForceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/radio-station-suggestions/${encodeURIComponent(id)}/reject`,
    'POST',
    note ? { note } : undefined,
  );
}

export type RadioStationSuggestionInput = {
  name: string;
  logoUrl: string;
  language: string;
  bitrateKbps: string;
  streamUrl: string;
};

export async function submitRadioStationSuggestion(
  input: RadioStationSuggestionInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await mutate('/api/me/radio-station-suggestions', 'POST', {
      name: input.name,
      logoUrl: input.logoUrl || null,
      language: input.language,
      bitrateKbps: input.bitrateKbps ? Number(input.bitrateKbps) : null,
      streamUrl: input.streamUrl,
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not submit suggestion',
    };
  }
}
