import { describe, expect, it } from 'vitest';

import { isGoLiveTakeoverPath } from './goLivePath';

describe('isGoLiveTakeoverPath', () => {
  it('matches Go live and nested paths only', () => {
    expect(isGoLiveTakeoverPath('/studio/go-live')).toBe(true);
    expect(isGoLiveTakeoverPath('/studio/go-live/')).toBe(true);
    expect(isGoLiveTakeoverPath('/studio/channel')).toBe(false);
    expect(isGoLiveTakeoverPath('/studio')).toBe(false);
  });
});
