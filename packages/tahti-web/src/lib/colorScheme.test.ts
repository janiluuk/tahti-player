import { describe, expect, it } from 'vitest';

import { normalizeColorScheme } from './colorScheme';

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
