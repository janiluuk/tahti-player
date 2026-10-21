import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createShowSeries, patchShowSeries } from './series';
import type { WireLiveShowSeries } from './wire';

const { requestJson } = vi.hoisted(() => ({ requestJson: vi.fn() }));

vi.mock('../request-json', () => ({ requestJson }));
vi.mock('../mode', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../mode')>()),
  isForceMock: () => false,
}));

const wireSeries: WireLiveShowSeries = {
  id: 'series-1',
  name: 'Deep Forest',
  description: null,
  tagline: 'Slow techno for a Friday',
  artworkUrl: null,
  showType: 'LIVE_SET',
  nextEpisodeNumber: 1,
  intervalHours: 1,
  scheduleNote: 'Fridays 20:00',
  createdAt: '2026-10-01T00:00:00.000Z',
};

function sentBody() {
  const [, init] = requestJson.mock.calls[0] as [string, { body: string }];
  return JSON.parse(init.body) as Record<string, unknown>;
}

describe('show series tagline', () => {
  beforeEach(() => {
    requestJson.mockReset();
    requestJson.mockResolvedValue({ data: wireSeries });
  });

  it('sends the tagline and air time as separate fields when creating a show', async () => {
    const result = await createShowSeries({
      title: 'Deep Forest',
      tagline: 'Slow techno for a Friday',
      scheduleNote: 'Fridays 20:00',
    });

    expect(sentBody()).toMatchObject({
      tagline: 'Slow techno for a Friday',
      scheduleNote: 'Fridays 20:00',
    });
    expect(result).toMatchObject({
      ok: true,
      data: {
        tagline: 'Slow techno for a Friday',
        scheduleNote: 'Fridays 20:00',
      },
    });
  });

  it('sends only the tagline when that is the one change', async () => {
    await patchShowSeries('series-1', { tagline: null });
    expect(sentBody()).toEqual({ tagline: null });
  });

  it('reads a missing tagline as none', async () => {
    const withoutTagline: WireLiveShowSeries = { ...wireSeries };
    delete withoutTagline.tagline;
    requestJson.mockResolvedValue({ data: withoutTagline });
    const result = await patchShowSeries('series-1', { title: 'Deep Forest' });
    expect(result).toMatchObject({ ok: true, data: { tagline: null } });
  });
});
