import { i18n } from '@tahti-player/i18n';

import type { FetchMeta } from '../client';
import { getJson, mutate } from '../http';
import { failMeta, isForceMock } from '../mode';

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
      return { ok: false, error: i18n.t('web:batch58.noPlayableAudio') };
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

// Listener-submitted *external* internet radio stations (Store & forward
// widget), not to be confused with AdminRadioSubmission above, which audits
// tracks submitted for Tahti's own co-op radio rotation.

export type AdminRadioStationSuggestionStatus =
  'PENDING' | 'APPROVED' | 'REJECTED';

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
  const result = await mutate('/api/me/radio-station-suggestions', 'POST', {
    name: input.name,
    logoUrl: input.logoUrl || null,
    language: input.language,
    bitrateKbps: input.bitrateKbps ? Number(input.bitrateKbps) : null,
    streamUrl: input.streamUrl,
  });
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
