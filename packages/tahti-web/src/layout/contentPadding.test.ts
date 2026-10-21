import { describe, expect, it } from 'vitest';

import { isFullBleedRoute } from './contentPadding';

describe('isFullBleedRoute', () => {
  it('covers the channel and track pages', () => {
    expect(isFullBleedRoute('/channel/tahti-selects')).toBe(true);
    expect(isFullBleedRoute('/channel/tahti-selects/')).toBe(true);
    expect(isFullBleedRoute('/t/abc123')).toBe(true);
  });

  it('leaves every other page inset', () => {
    expect(isFullBleedRoute('/')).toBe(false);
    expect(isFullBleedRoute('/u/liis-kask')).toBe(false);
    expect(isFullBleedRoute('/tags/ambient')).toBe(false);
    expect(isFullBleedRoute('/studio/channel')).toBe(false);
    expect(isFullBleedRoute('/channel/tahti-selects/extra')).toBe(false);
  });
});
