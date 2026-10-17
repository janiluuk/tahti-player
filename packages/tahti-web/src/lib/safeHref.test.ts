import { describe, expect, it } from 'vitest';

import { isSafeChannelLinkUrl, isSafeHref } from './safeHref';

describe('isSafeHref', () => {
  it('allows http(s) and rejects javascript:', () => {
    expect(isSafeHref('https://example.com')).toBe(true);
    expect(isSafeHref('javascript:alert(1)')).toBe(false);
    expect(isSafeHref('')).toBe(false);
  });
});

describe('isSafeChannelLinkUrl', () => {
  it('allows empty, http(s), and mailto', () => {
    expect(isSafeChannelLinkUrl('')).toBe(true);
    expect(isSafeChannelLinkUrl('https://bandcamp.com/x')).toBe(true);
    expect(isSafeChannelLinkUrl('mailto:fan@example.com')).toBe(true);
    expect(isSafeChannelLinkUrl('javascript:alert(1)')).toBe(false);
  });
});
