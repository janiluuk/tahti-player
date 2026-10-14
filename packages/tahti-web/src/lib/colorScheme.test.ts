import { describe, expect, it } from 'vitest';

import {
  contrastRatio,
  normalizeColorScheme,
  readableMuted,
} from './colorScheme';

describe('normalizeColorScheme', () => {
  it('falls back to a high-contrast dark bg / light text pair when unset', () => {
    const scheme = normalizeColorScheme(undefined);
    expect(scheme.bg).toBe('#0B1220');
    expect(scheme.text).toBe('#F8FAFC');
  });

  it('keeps an explicit text color even with a custom bg', () => {
    const scheme = normalizeColorScheme({ bg: '#F8FAFC', text: '#0B1220' });
    expect(scheme.bg).toBe('#F8FAFC');
    expect(scheme.text).toBe('#0B1220');
  });

  it('picks dark text for a light custom bg with no text override', () => {
    const scheme = normalizeColorScheme({ bg: '#F5F5F5' });
    expect(scheme.text).toBe('#0B1220');
  });

  it('picks light text for a dark custom bg with no text override', () => {
    const scheme = normalizeColorScheme({ bg: '#111111' });
    expect(scheme.text).toBe('#F8FAFC');
  });
});

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for a color on itself', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21);
    expect(contrastRatio('#64748B', '#64748B')).toBeCloseTo(1);
  });

  it('is null for a color it cannot parse', () => {
    expect(contrastRatio('teal', '#000000')).toBeNull();
  });
});

describe('readableMuted', () => {
  it('falls back to the text color when muted is too dim on the bg', () => {
    const scheme = normalizeColorScheme({ bg: '#0B1220', muted: '#64748B' });
    expect(readableMuted(scheme)).toBe(scheme.text);
  });

  it('keeps a muted color that reads at 4.5:1', () => {
    const scheme = normalizeColorScheme({ bg: '#0B1220', muted: '#94A3B8' });
    expect(readableMuted(scheme)).toBe('#94A3B8');
  });
});
