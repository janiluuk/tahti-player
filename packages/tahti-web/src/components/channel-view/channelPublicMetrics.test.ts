import { describe, expect, it } from 'vitest';

import { buildChannelPublicMetricRows } from './channelPublicMetrics';

const labels = {
  playsToday: 'Plays today',
  playsYesterday: 'Plays yesterday',
};

describe('buildChannelPublicMetricRows', () => {
  it('returns no rows when every count is hidden', () => {
    expect(buildChannelPublicMetricRows({}, labels)).toEqual([]);
  });

  it('includes only keys present on the channel payload', () => {
    const rows = buildChannelPublicMetricRows(
      {
        followerCount: 12,
        followingCount: null,
        metrics: {
          playsTotal: 47875,
          playsToday: 40,
        },
      },
      labels,
    );
    expect(rows.map((r) => r.key)).toEqual([
      'followers',
      'playsToday',
      'playsTotal',
    ]);
    expect(rows.find((r) => r.key === 'playsTotal')?.value).toBe(47875);
  });

  it('falls back to publicPlays when metrics.playsTotal is absent', () => {
    const rows = buildChannelPublicMetricRows(
      { publicPlays: 9, metrics: { downloads: 2 } },
      labels,
    );
    expect(rows.map((r) => r.key)).toEqual(['playsTotal', 'downloads']);
  });
});
