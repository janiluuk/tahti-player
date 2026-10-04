import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as http from './http';
import {
  clearStationProgrammeCache,
  fetchStationNowPlaying,
  fetchStationProgramme,
  formatStationProgramme,
} from './radio-now-playing';
import * as sources from './radio-sources';

describe('station now playing', () => {
  beforeEach(() => {
    clearStationProgrammeCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('joins the programme and the track', () => {
    expect(
      formatStationProgramme({
        title: 'CADIA',
        artist: 'Bloc Party — Positive Tension',
      }),
    ).toBe('CADIA · Bloc Party — Positive Tension');
    expect(formatStationProgramme({ title: null, artist: 'Viivi' })).toBe(
      'Viivi',
    );
    expect(formatStationProgramme({ title: ' ', artist: null })).toBeNull();
    expect(formatStationProgramme(null)).toBeNull();
  });

  it('asks the API once per page within a minute', async () => {
    const get = vi
      .spyOn(http, 'getJson')
      .mockResolvedValue({ title: 'Usa', artist: 'Viivi' });
    const url = 'https://www.radioplay.fi/nrj';
    expect(await fetchStationProgramme(url)).toBe('Usa · Viivi');
    expect(await fetchStationProgramme(url)).toBe('Usa · Viivi');
    expect(get).toHaveBeenCalledTimes(1);
    expect(get.mock.calls[0]?.[0]).toBe(
      `/api/v1/internet-radio/now-playing?url=${encodeURIComponent(url)}`,
    );
  });

  it('falls back to the title the stream announces', async () => {
    vi.spyOn(http, 'getJson').mockRejectedValue(new Error('404'));
    const icy = vi
      .spyOn(sources, 'readIcyStreamTitle')
      .mockResolvedValue('Stream Title');
    expect(
      await fetchStationNowPlaying({
        programmingUrl: 'https://www.radiorock.fi/',
        streamUrl: 'https://example.test/stream',
      }),
    ).toBe('Stream Title');
    expect(icy).toHaveBeenCalledWith('https://example.test/stream');
  });

  it('prefers the programme page over the stream title', async () => {
    vi.spyOn(http, 'getJson').mockResolvedValue({
      title: 'CADIA',
      artist: null,
    });
    const icy = vi.spyOn(sources, 'readIcyStreamTitle');
    expect(
      await fetchStationNowPlaying({
        programmingUrl: 'https://www.radiohelsinki.fi/ohjelmakartta/',
        streamUrl: 'https://example.test/stream',
      }),
    ).toBe('CADIA');
    expect(icy).not.toHaveBeenCalled();
  });
});
