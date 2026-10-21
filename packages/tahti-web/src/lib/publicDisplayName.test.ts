import { describe, expect, it } from 'vitest';

import { isPlausiblePublicName } from './publicDisplayName';

describe('isPlausiblePublicName', () => {
  it('rejects empty names', () => {
    expect(isPlausiblePublicName('')).toBe(false);
    expect(isPlausiblePublicName('   ')).toBe(false);
  });

  it('rejects long lowercase alphanumeric tokens', () => {
    expect(isPlausiblePublicName('0fpmbnvefhfgrqd6fdp')).toBe(false);
  });

  it('rejects short vowel-less keyboard mash', () => {
    expect(isPlausiblePublicName('sjsj')).toBe(false);
    expect(isPlausiblePublicName('jddkkfk')).toBe(false);
  });

  it('keeps normal artist names', () => {
    expect(isPlausiblePublicName('DJ Shadow')).toBe(true);
    expect(isPlausiblePublicName('Aphex Twin')).toBe(true);
    expect(isPlausiblePublicName('M83')).toBe(true);
    expect(isPlausiblePublicName('rhythm')).toBe(true);
    expect(isPlausiblePublicName('Björk')).toBe(true);
  });
});
