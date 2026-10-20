import { describe, expect, it } from 'vitest';

import {
  colourLightness,
  generateAdvancedThemeCSS,
  withDerivedTokens,
} from '../../advanced/generator';

describe('generateAdvancedThemeCSS', () => {
  it('produces CSS for light and dark vars', () => {
    const css = generateAdvancedThemeCSS({
      version: 1,
      name: 'Test',
      vars: {
        background: 'oklch(98% 0 0)',
        primary: 'oklch(70% 0.1 250)',
      },
      dark: {
        background: 'oklch(40% 0.03 277)',
        primary: 'oklch(70% 0.1 250)',
      },
    });

    expect(css).toMatchInlineSnapshot(`
      ":root{--background: oklch(98% 0 0); --primary: oklch(70% 0.1 250); --primary-strong: var(--primary); --background-input: var(--background);}
      [data-theme='dark']{--background: oklch(40% 0.03 277); --primary: oklch(70% 0.1 250); --primary-strong: var(--primary); --background-input: var(--background);}"
    `);
  });

  it('handles partial themes and trims whitespace', () => {
    const css = generateAdvancedThemeCSS({
      version: 1,
      name: 'Partial',
      vars: { radius: ' 10px  ' },
    });

    expect(css).toMatchInlineSnapshot(`
":root{--radius: 10px;}"`);
  });

  it('fills tokens a theme leaves out from the ones it sets', () => {
    const vars = withDerivedTokens({
      background: 'oklch(0.96 0.055 96)',
      'background-secondary': 'oklch(0.89 0.057 89)',
      foreground: 'oklch(0.34 0.007 48)',
      border: 'oklch(0.41 0.011 52)',
      primary: 'oklch(0.62 0.171 46)',
    });

    expect(vars).toMatchObject({
      'primary-strong': 'var(--primary)',
      secondary: 'var(--background-secondary)',
      'secondary-foreground': 'var(--foreground)',
      'background-input': 'var(--background)',
      'foreground-input': 'var(--foreground)',
      'border-input': 'var(--border)',
      'primary-foreground': 'var(--background)',
    });
  });

  it('never overrides a token the theme sets', () => {
    const vars = withDerivedTokens({
      foreground: '#111',
      'foreground-input': '#222',
      primary: '#fff',
      background: '#000',
      'primary-foreground': '#333',
    });

    expect(vars['foreground-input']).toBe('#222');
    expect(vars['primary-foreground']).toBe('#333');
  });

  it('picks the text colour that contrasts more with the primary', () => {
    expect(
      withDerivedTokens({
        primary: '#f0f0f0',
        background: '#ffffff',
        foreground: '#101010',
      })['primary-foreground'],
    ).toBe('var(--foreground)');
  });

  it('reads lightness from oklch and hex colours', () => {
    expect(colourLightness('oklch(62% 0.1 40)')).toBeCloseTo(0.62);
    expect(colourLightness('oklch(0.3 0.1 40)')).toBeCloseTo(0.3);
    expect(colourLightness('#ffffff')).toBeCloseTo(1);
    expect(colourLightness('#000')).toBeCloseTo(0);
    expect(colourLightness('var(--x)')).toBeNull();
  });
});
