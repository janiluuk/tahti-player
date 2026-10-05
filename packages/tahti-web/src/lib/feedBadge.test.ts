import { describe, expect, it } from 'vitest';

import type { FeedItem } from '../api/types';
import { feedBadge } from './feedBadge';

const release = (releaseType: string) =>
  ({ kind: 'release', releaseType }) as FeedItem;

describe('feedBadge', () => {
  it('uses the right article for each release type', () => {
    expect(feedBadge(release('ALBUM'))).toBe('released an album');
    expect(feedBadge(release('EP'))).toBe('released an EP');
    expect(feedBadge(release('SINGLE'))).toBe('released a single');
    expect(feedBadge(release('COMPILATION'))).toBe('released a compilation');
    expect(feedBadge(release('REMIX'))).toBe('released a remix');
  });

  it('falls back for a release type it does not know', () => {
    expect(feedBadge(release('LIVE_SET'))).toBe('released new music');
  });

  it('labels posts and tracks', () => {
    expect(feedBadge({ kind: 'post' } as FeedItem)).toBe('posted');
    expect(feedBadge({ kind: 'track' } as FeedItem)).toBe('shared a track');
  });
});
