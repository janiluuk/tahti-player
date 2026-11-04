import { afterEach, describe, expect, it } from 'vitest';

import { applyLocale } from '../../../lib/locale';
import { formatUploadDate } from './SoundsAmbientList';

describe('formatUploadDate', () => {
  afterEach(async () => {
    await applyLocale('en_US');
  });

  it('formats with the app language tag', async () => {
    await applyLocale('en_US');
    const english = formatUploadDate('2026-03-15T12:00:00.000Z');
    await applyLocale('fi_FI');
    const finnish = formatUploadDate('2026-03-15T12:00:00.000Z');
    expect(english).toBeTruthy();
    expect(finnish).toBeTruthy();
    expect(finnish).toMatch(/15/);
    expect(finnish).not.toBe(english);
  });

  it('returns null for empty and invalid values', () => {
    expect(formatUploadDate(undefined)).toBeNull();
    expect(formatUploadDate('not-a-date')).toBeNull();
  });
});
