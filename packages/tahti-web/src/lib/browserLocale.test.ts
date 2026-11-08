import { describe, expect, it } from 'vitest';

import { browserLocale } from './locale';

describe('browserLocale', () => {
  it('picks the first browser language Tahti has a web catalog for', () => {
    expect(browserLocale(['fi-FI', 'en-US'])).toBe('fi_FI');
    expect(browserLocale(['fi'])).toBe('fi_FI');
    expect(browserLocale(['sv-FI', 'fi'])).toBe('fi_FI');
    expect(browserLocale(['de-DE', 'en-GB'])).toBe('en_US');
  });

  it('falls back to English', () => {
    expect(browserLocale(['sv-SE'])).toBe('en_US');
    expect(browserLocale([])).toBe('en_US');
  });
});
