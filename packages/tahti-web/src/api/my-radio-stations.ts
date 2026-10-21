import type { FetchMeta } from './client';
import { getJson, sendJson } from './http';
import { failMeta, isForceMock } from './mode';

/** A listener's own internet radio station, played straight from its
 * stream URL in the browser (never relayed through Tahti). */
export type MyRadioStation = {
  id: string;
  presetId: string | null;
  name: string;
  genre: string | null;
  description: string | null;
  iconUrl: string | null;
  programmingUrl: string | null;
  streamUrl: string | null;
  position: number;
  currentProgramTitle: string | null;
  currentProgramArtist: string | null;
  currentProgramFetchedAt: string | null;
};

export type NewRadioStation = {
  name: string;
  streamUrl: string;
  genre?: string;
};

let mockStations: MyRadioStation[] = [
  {
    id: 'mock-station-1',
    presetId: null,
    name: 'Yle Radio Suomi',
    genre: 'Talk',
    description: null,
    iconUrl: null,
    programmingUrl: null,
    streamUrl: 'https://example.com/radio-suomi.mp3',
    position: 0,
    currentProgramTitle: null,
    currentProgramArtist: null,
    currentProgramFetchedAt: null,
  },
];

export async function fetchMyRadioStations(): Promise<{
  data: MyRadioStation[] | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockStations,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ stations: MyRadioStation[] }>(
      '/api/me/internet-radio',
    );
    return {
      data: Array.isArray(data.stations) ? data.stations : [],
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function addMyRadioStation(
  station: NewRadioStation,
): Promise<{ ok: true; data: MyRadioStation } | { ok: false; error: string }> {
  if (isForceMock()) {
    const created: MyRadioStation = {
      id: `mock-station-${Date.now()}`,
      presetId: null,
      name: station.name,
      genre: station.genre ?? null,
      description: null,
      iconUrl: null,
      programmingUrl: null,
      streamUrl: station.streamUrl,
      position: mockStations.length,
      currentProgramTitle: null,
      currentProgramArtist: null,
      currentProgramFetchedAt: null,
    };
    mockStations = [...mockStations, created];
    return { ok: true, data: created };
  }
  try {
    const data = await sendJson<MyRadioStation>(
      '/api/me/internet-radio',
      'POST',
      station,
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not add the station',
    };
  }
}

export async function removeMyRadioStation(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockStations = mockStations.filter((station) => station.id !== id);
    return { ok: true };
  }
  try {
    await sendJson(
      `/api/me/internet-radio/${encodeURIComponent(id)}`,
      'DELETE',
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not remove the station',
    };
  }
}
