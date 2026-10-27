import { requestJson } from './client-request';
import { apiErrorMeta, isForceMock, type FetchMeta } from './mode';

export type MyListeningRange = '7' | '30' | 'all';

export type MyListening = {
  range: MyListeningRange;
  minutes: number;
  listens: number;
  topArtists: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
    minutes: number;
  }[];
  topTracks: {
    soundId: string;
    title: string;
    artistName: string;
    minutes: number;
  }[];
};

export const MOCK_MY_LISTENING: MyListening = {
  range: '30',
  minutes: 1_284,
  listens: 96,
  topArtists: [
    {
      username: 'kaiku',
      displayName: 'Kaiku Collective',
      avatarUrl: null,
      minutes: 412,
    },
    {
      username: 'night-drive',
      displayName: 'Night Drive',
      avatarUrl: null,
      minutes: 233,
    },
    {
      username: 'tahti-radio',
      displayName: 'Tahti Radio',
      avatarUrl: null,
      minutes: 180,
    },
  ],
  topTracks: [
    {
      soundId: 's1',
      title: 'Polar Night',
      artistName: 'Northern Lights',
      minutes: 64,
    },
    {
      soundId: 's2',
      title: 'Harbour Lights',
      artistName: 'Kuudes Linja',
      minutes: 41,
    },
  ],
};

/** The signed-in listener's own listening on every device, from the API. */
export async function fetchMyListening(
  range: MyListeningRange,
): Promise<{ data: MyListening | null; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: { ...MOCK_MY_LISTENING, range },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<MyListening>(
      `/api/me/listening?range=${range}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: apiErrorMeta(err) };
  }
}
