import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { probeRadioStream } from '../api/radio-sources';
import { useStationHealthStore } from './stationHealthStore';

vi.mock('../api/radio-sources', () => ({ probeRadioStream: vi.fn() }));

const URL = 'https://radio.example/live';

beforeEach(() => {
  useStationHealthStore.getState().reset();
});

afterEach(() => {
  vi.mocked(probeRadioStream).mockReset();
});

describe('stationHealthStore.check', () => {
  it('records a failed probe as unavailable', async () => {
    vi.mocked(probeRadioStream).mockResolvedValue({
      state: 'failed',
      failure: { reason: 'http', status: 404 },
    });

    await useStationHealthStore.getState().check(URL);

    expect(useStationHealthStore.getState().byUrl[URL]).toMatchObject({
      state: 'unavailable',
      failure: { reason: 'http', status: 404 },
    });
  });

  it('records an inconclusive probe as unknown', async () => {
    vi.mocked(probeRadioStream).mockResolvedValue({ state: 'unknown' });

    await useStationHealthStore.getState().check(URL);

    expect(useStationHealthStore.getState().byUrl[URL]).toMatchObject({
      state: 'unknown',
    });
  });

  it('leaves a timeout inconclusive when asked to', async () => {
    vi.mocked(probeRadioStream).mockResolvedValue({
      state: 'failed',
      failure: { reason: 'timeout' },
    });

    await useStationHealthStore.getState().check(URL, { timeoutCounts: false });

    expect(useStationHealthStore.getState().byUrl[URL]).toMatchObject({
      state: 'unknown',
    });
  });

  it('records a working stream as ok', async () => {
    vi.mocked(probeRadioStream).mockResolvedValue({ state: 'ok', status: 200 });

    await useStationHealthStore.getState().check(URL);

    expect(useStationHealthStore.getState().byUrl[URL]).toMatchObject({
      state: 'ok',
    });
  });
});
