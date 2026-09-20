import { fetchChannel } from './client';
import { requestJson } from './client-request';
import { listEnabledMockInternetRadioPresets } from './internetRadioPresetsMockStore';
import {
  mockRadio,
  mockRadioRecentlyPlayed,
  radioToPlayable,
  TAHTI_RADIO_SLUG,
} from './mock';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
  withMockFallback,
  type FetchMeta,
} from './mode';
import type {
  PublicChannel,
  RadioNowPlaying,
  RadioRecentlyPlayedItem,
  TahtiPlayable,
} from './types';

async function getJson<T>(path: string): Promise<T> {
  const { data } = await requestJson<T>(path);
  return data;
}

export async function fetchRadio(): Promise<{
  data: RadioNowPlaying;
  meta: FetchMeta;
  playable: TahtiPlayable | null;
}> {
  if (isForceMock()) {
    const data = mockRadio();
    return {
      data,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
      playable: radioToPlayable(data),
    };
  }
  try {
    const data = await getJson<RadioNowPlaying>('/api/v1/radio');
    if (data.live && data.channel?.slug && !data.channel.hlsUrl) {
      const ch = await fetchChannel(data.channel.slug);
      if (ch.playable) {
        return {
          data: {
            ...data,
            channel: {
              ...data.channel,
              hlsUrl: ch.playable.streamUrl,
              displayName: ch.data.user.displayName,
            },
          },
          meta: ch.meta,
          playable: {
            ...ch.playable,
            kind: 'radio',
            id: `radio:${ch.data.slug}`,
            title: data.channel.title ?? ch.playable.title,
          },
        };
      }
    }
    return { data, meta: { source: 'api' }, playable: radioToPlayable(data) };
  } catch (err) {
    if (allowMockFallback()) {
      const data = mockRadio();
      return { data, meta: failMeta(err), playable: radioToPlayable(data) };
    }
    return {
      data: { live: false, channel: null },
      meta: apiErrorMeta(err),
      playable: null,
    };
  }
}

/** Board-curated internet radio station, shown in the Listen page radio feed
 * for every visitor (no auth) once an admin marks it enabled. */
export type EnabledInternetRadioPreset = {
  id: string;
  name: string;
  genre: string | null;
  description: string | null;
  iconUrl: string | null;
  programmingUrl: string | null;
  streamUrl: string | null;
};

function mockEnabledInternetRadioPresets(): EnabledInternetRadioPreset[] {
  return listEnabledMockInternetRadioPresets();
}

export async function fetchEnabledInternetRadioPresets(): Promise<{
  data: EnabledInternetRadioPreset[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockEnabledInternetRadioPresets(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ presets: EnabledInternetRadioPreset[] }>(
      '/api/v1/internet-radio/presets/enabled',
    );
    return { data: data.presets, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(err, mockEnabledInternetRadioPresets, () => []);
  }
}

/** Always-on Tahti Radio station (`/api/channels/tahti-radio`) — primary `/radio` feed. */
export async function fetchRadioStation(): Promise<{
  data: PublicChannel;
  meta: FetchMeta;
  playable: TahtiPlayable | null;
}> {
  return fetchChannel(TAHTI_RADIO_SLUG);
}

export async function fetchRadioRecentlyPlayed(): Promise<{
  data: RadioRecentlyPlayedItem[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockRadioRecentlyPlayed(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<RadioRecentlyPlayedItem[]>(
      '/api/v1/radio/recently-played',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(err, mockRadioRecentlyPlayed, () => []);
  }
}
