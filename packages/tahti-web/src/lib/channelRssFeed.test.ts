import { describe, expect, it } from 'vitest';

import { channelRssFeedUrl } from './channelRssFeed';

describe('channelRssFeedUrl', () => {
  it('builds an absolute feed URL for the channel', () => {
    expect(channelRssFeedUrl('night drive')).toBe(
      `${window.location.origin}/tahti-api/api/v1/c/night%20drive/rss.xml`,
    );
  });
});
