import type { FetchMeta } from '../client';
import { getJson, mutate } from '../http';
import { failMeta, isForceMock } from '../mode';

// ── Tahti Selects ───────────────────────────────────────────────────────────

export type AdminSelectsItem = {
  id: string;
  soundId: string;
  title: string;
  durationSec: number | null;
  license: string;
  artistName: string;
  channelSlug: string;
  addedBy: string;
  audioUrl?: string | null;
};

export type AdminSelectsBrowseItem = {
  id: string;
  title: string;
  durationSec: number | null;
  license: string;
  artistName: string;
  channelSlug: string;
  audioUrl?: string | null;
};

export type AdminSelectsStream = {
  state: 'OFFLINE' | 'STARTING' | 'LIVE' | string;
  hlsUrl: string | null;
  nowPlaying: {
    title: string;
    artistName: string;
    artworkUrl?: string | null;
  } | null;
};

let mockSelectsItems: AdminSelectsItem[] | null = null;
let mockSelectsStreamRunning = false;

function selectsState(): AdminSelectsItem[] {
  if (!mockSelectsItems) {
    mockSelectsItems = [
      {
        id: 'sel-1',
        soundId: 'arch-nl-1',
        title: 'Aurora Drift',
        durationSec: 372,
        license: 'CC_BY',
        artistName: 'Northern Lights',
        channelSlug: 'northern-lights',
        addedBy: 'board-jani',
        audioUrl:
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      },
      {
        id: 'sel-2',
        soundId: 'arch-mc-1',
        title: 'Route 550',
        durationSec: 541,
        license: 'CC_BY_SA',
        artistName: 'Midnight Cartography',
        channelSlug: 'midnight-cartography',
        addedBy: 'board-jani',
        audioUrl:
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      },
    ];
  }
  return mockSelectsItems;
}

function mockSelectsBrowse(): AdminSelectsBrowseItem[] {
  return [
    {
      id: 'arch-dj-1',
      title: 'Moonlight Drive',
      durationSec: 312,
      license: 'CC_BY',
      artistName: 'DJ Moonlight',
      channelSlug: 'dj-moonlight',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    },
    {
      id: 'arch-kc-1',
      title: 'Echo Chamber Cypher',
      durationSec: 254,
      license: 'ALL_RIGHTS_RESERVED',
      artistName: 'Kaiku Collective',
      channelSlug: 'kaiku-collective',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    },
  ];
}

export async function fetchAdminSelects(): Promise<{
  data: { items: AdminSelectsItem[]; stream: AdminSelectsStream };
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    const current = selectsState()[0] ?? null;
    return {
      data: {
        items: selectsState(),
        stream: {
          state: mockSelectsStreamRunning ? 'LIVE' : 'OFFLINE',
          hlsUrl: mockSelectsStreamRunning ? (current?.audioUrl ?? null) : null,
          nowPlaying:
            mockSelectsStreamRunning && current
              ? { title: current.title, artistName: current.artistName }
              : null,
        },
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const rotation = await getJson<{ items: AdminSelectsItem[] }>(
      '/api/admin/tahti-selects',
    );
    let stream: AdminSelectsStream = {
      state: 'OFFLINE',
      hlsUrl: null,
      nowPlaying: null,
    };
    try {
      stream = await getJson<AdminSelectsStream>('/api/channels/tahti-selects');
    } catch {
      stream = { state: 'OFFLINE', hlsUrl: null, nowPlaying: null };
    }
    return {
      data: { items: rotation.items ?? [], stream },
      meta: { source: 'api' },
    };
  } catch (err) {
    return {
      data: {
        items: [],
        stream: { state: 'OFFLINE', hlsUrl: null, nowPlaying: null },
      },
      meta: failMeta(err),
    };
  }
}

export async function searchAdminSelectsBrowse(
  q: string,
): Promise<{ data: AdminSelectsBrowseItem[]; meta: FetchMeta }> {
  if (isForceMock()) {
    const query = q.toLowerCase();
    return {
      data: mockSelectsBrowse().filter((i) =>
        i.title.toLowerCase().includes(query),
      ),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ items: AdminSelectsBrowseItem[] }>(
      `/api/admin/tahti-selects/browse?q=${encodeURIComponent(q)}`,
    );
    return { data: data.items, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export function addToSelectsRotation(item: AdminSelectsBrowseItem) {
  if (isForceMock()) {
    selectsState().push({
      id: `sel-${Date.now()}`,
      soundId: item.id,
      title: item.title,
      durationSec: item.durationSec,
      license: item.license,
      artistName: item.artistName,
      channelSlug: item.channelSlug,
      addedBy: 'you',
    });
    return Promise.resolve({ ok: true } as const);
  }
  return mutate('/api/admin/tahti-selects/items', 'POST', {
    soundId: item.id,
  });
}

export function removeFromSelectsRotation(id: string) {
  if (isForceMock()) {
    mockSelectsItems = selectsState().filter((i) => i.id !== id);
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/tahti-selects/items/${encodeURIComponent(id)}`,
    'DELETE',
  );
}

export function reorderSelectsItem(id: string, position: number) {
  if (isForceMock()) {
    const items = selectsState();
    const idx = items.findIndex((i) => i.id === id);
    const target = Math.max(0, Math.min(position, items.length - 1));
    if (idx < 0 || target < 0 || target >= items.length) {
      return Promise.resolve({ ok: true } as const);
    }
    [items[idx], items[target]] = [items[target]!, items[idx]!];
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/tahti-selects/items/${encodeURIComponent(id)}/reorder`,
    'PATCH',
    { position },
  );
}

export function reorderSelectsRotation(itemIds: string[]) {
  if (isForceMock()) {
    const byId = new Map(selectsState().map((item) => [item.id, item]));
    mockSelectsItems = itemIds
      .map((id) => byId.get(id))
      .filter((item): item is AdminSelectsItem => Boolean(item));
    return Promise.resolve({ ok: true } as const);
  }
  return mutate('/api/admin/tahti-selects/reorder', 'PUT', {
    itemIds,
  });
}

export function startSelectsStream() {
  if (isForceMock()) {
    mockSelectsStreamRunning = true;
    return Promise.resolve({ ok: true } as const);
  }
  return mutate('/api/admin/tahti-selects/stream/start', 'POST');
}

export function stopSelectsStream() {
  if (isForceMock()) {
    mockSelectsStreamRunning = false;
    return Promise.resolve({ ok: true } as const);
  }
  return mutate('/api/admin/tahti-selects/stream/stop', 'POST');
}
