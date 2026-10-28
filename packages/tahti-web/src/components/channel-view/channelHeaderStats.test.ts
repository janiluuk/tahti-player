import { describe, expect, it } from 'vitest';

import type { PublicChannel } from '../../api/types';
import { channelHeaderStats } from './channelHeaderStats';

const channel = (extra: Partial<PublicChannel>) =>
  ({ slug: 'yaniho', ...extra }) as PublicChannel;

describe('channelHeaderStats', () => {
  it('shows followers and plays, preferring the live follower count', () => {
    const stats = channelHeaderStats(
      channel({ followerCount: 10, publicPlays: 214 }),
      11,
    );
    expect(stats.map((s) => [s.key, s.value])).toEqual([
      ['followers', 11],
      ['plays', 214],
    ]);
  });

  it('leaves out zero or missing values', () => {
    expect(
      channelHeaderStats(channel({ followerCount: 0, publicPlays: 0 }), null),
    ).toEqual([]);
    expect(channelHeaderStats(channel({}), undefined)).toEqual([]);
  });
});
