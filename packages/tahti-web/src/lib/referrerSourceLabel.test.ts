import { describe, expect, it } from 'vitest';

import {
  isHttpReferrerUrl,
  referrerSourceLabel,
  truncateReferrerLabel,
} from './referrerSourceLabel';

describe('referrerSourceLabel', () => {
  it('truncates long URLs', () => {
    const long = `https://example.com/${'a'.repeat(80)}`;
    expect(truncateReferrerLabel(long, 40).endsWith('…')).toBe(true);
    expect(truncateReferrerLabel(long, 40).length).toBe(40);
  });

  it('detects absolute http(s) URLs', () => {
    expect(isHttpReferrerUrl('https://instagram.com/p/x')).toBe(true);
    expect(isHttpReferrerUrl('instagram.com')).toBe(false);
  });

  it('labels Other as sites or pages by mode', () => {
    expect(referrerSourceLabel('Other', 2, 'host', 'en-US')).toContain(
      'Other sites',
    );
    expect(referrerSourceLabel('Other', 2, 'url', 'en-US')).toContain(
      'Other pages',
    );
  });
});
