import { i18n } from '@tahti-player/i18n';

import { sortRotationByPosition } from '../../lib/radioRotationOnAir';
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
  mockFallbackMeta,
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
  /** Play order; absent on older API deploys. */
  position?: number;
  title: string;
  artistName: string;
  durationSec: number | null;
  soundId: string;
  audioUrl?: string | null;
  channelSlug: string;
  license: string;
  addedBy: string;
};

export type AdminRadioBrowseItem = {
  id: string;
  title: string;
  durationSec: number | null;
  license: string;
  artistName: string;
  channelSlug: string;
  audioUrl?: string | null;
};

let mockRadioRotation: AdminRadioRotationItem[] | null = null;

function radioRotationState(): AdminRadioRotationItem[] {
  if (!mockRadioRotation) {
    mockRadioRotation = [
      {
        id: 'radio-rotation-1',
        soundId: 'radio-archive-1',
        title: 'Night Transit',
        artistName: 'Aino Virta',
        durationSec: 288,
        channelSlug: 'northern-lights',
        license: 'CC_BY',
        addedBy: 'radio-editorial',
        audioUrl:
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      },
      {
        id: 'radio-rotation-2',
        soundId: 'mock-rp-1',
        title: 'Aurora Drift',
        artistName: 'Northern Lights',
        durationSec: 346,
        channelSlug: 'northern-lights',
        license: 'CC_BY_SA',
        addedBy: 'radio-editorial',
        audioUrl:
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      },
    ];
  }
  return mockRadioRotation;
}

function mockRadioBrowse(): AdminRadioBrowseItem[] {
  return [
    {
      id: 'radio-archive-3',
      title: 'Harbor Lights',
      durationSec: 301,
      license: 'CC_BY',
      artistName: 'DJ Moonlight',
      channelSlug: 'dj-moonlight',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    },
    {
      id: 'radio-archive-4',
      title: 'Glass Orchard',
      durationSec: 254,
      license: 'ALL_RIGHTS_RESERVED',
      artistName: 'Kaiku Collective',
      channelSlug: 'kaiku-collective',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    },
  ];
}

export async function fetchAdminRadioRotation(): Promise<{
  data: AdminRadioRotationItem[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: radioRotationState(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ items: AdminRadioRotationItem[] }>(
      '/api/admin/tahti-radio',
    );
    return {
      data: sortRotationByPosition(data.items ?? []),
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function searchAdminRadioBrowse(
  q: string,
): Promise<{ data: AdminRadioBrowseItem[]; meta: FetchMeta }> {
  if (isForceMock()) {
    const query = q.toLowerCase();
    return {
      data: mockRadioBrowse().filter((item) =>
        item.title.toLowerCase().includes(query),
      ),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ items: AdminRadioBrowseItem[] }>(
      `/api/admin/tahti-radio/browse?q=${encodeURIComponent(q)}`,
    );
    return { data: data.items, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export function addToRadioRotation(item: AdminRadioBrowseItem) {
  if (isForceMock()) {
    radioRotationState().push({
      id: `radio-rotation-${Date.now()}`,
      soundId: item.id,
      title: item.title,
      durationSec: item.durationSec,
      license: item.license,
      artistName: item.artistName,
      channelSlug: item.channelSlug,
      addedBy: 'you',
      audioUrl: item.audioUrl,
    });
    return Promise.resolve({ ok: true } as const);
  }
  return mutate('/api/admin/tahti-radio/items', 'POST', {
    soundId: item.id,
  });
}

export function removeFromRadioRotation(id: string) {
  if (isForceMock()) {
    mockRadioRotation = radioRotationState().filter((item) => item.id !== id);
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/tahti-radio/items/${encodeURIComponent(id)}`,
    'DELETE',
  );
}

export function reorderRadioRotation(itemIds: string[]) {
  if (isForceMock()) {
    const byId = new Map(radioRotationState().map((item) => [item.id, item]));
    mockRadioRotation = itemIds
      .map((id) => byId.get(id))
      .filter((item): item is AdminRadioRotationItem => Boolean(item));
    return Promise.resolve({ ok: true } as const);
  }
  return mutate('/api/admin/tahti-radio/reorder', 'PUT', {
    itemIds,
  });
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
      return { data: mockRadioAdmin(), meta: mockFallbackMeta(err) };
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
    `/api/admin/radio/reset-rotation/${encodeURIComponent(channelId)}`,
    'POST',
  );
}

export function radioOptOut(channelId: string) {
  if (isForceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/radio/opt-out/${encodeURIComponent(channelId)}`,
    'POST',
  );
}

export function radioRemoveOptOut(channelId: string) {
  if (isForceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/radio/opt-out/${encodeURIComponent(channelId)}`,
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
      return { ok: false, error: i18n.t('web:batch58.presetNotFound') };
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
