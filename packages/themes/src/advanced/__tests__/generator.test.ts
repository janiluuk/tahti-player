import { describe, expect, it } from 'vitest';

import {
  colourLightness,
  colourScheme,
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
      "html:root{--background: oklch(98% 0 0); --primary: oklch(70% 0.1 250); --primary-strong: var(--primary); --background-input: var(--background); --focus-ring: oklch(0 0 0); color-scheme: light;}
      html[data-theme='dark']{--background: oklch(40% 0.03 277); --primary: oklch(70% 0.1 250); --primary-strong: var(--primary); --background-input: var(--background); --focus-ring: var(--primary); color-scheme: dark;}"
    `);
  });

  it('handles partial themes and trims whitespace', () => {
    const css = generateAdvancedThemeCSS({
      version: 1,
      name: 'Partial',
      vars: { radius: ' 10px  ' },
    });

    expect(css).toMatchInlineSnapshot(`"html:root{--radius: 10px;}"`);
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

  it('uses the primary as focus ring only where it stands out', () => {
    const surfaces = {
      background: '#ffffff',
      'background-secondary': '#f4f4f4',
      foreground: '#111111',
    };
    expect(
      withDerivedTokens({ ...surfaces, primary: '#1d4ed8' })['focus-ring'],
    ).toBe('var(--primary)');
    expect(
      withDerivedTokens({ ...surfaces, primary: '#fde68a' })['focus-ring'],
    ).toBe('var(--foreground)');
  });

  it('derives disabled and offline colours that read at 3:1', () => {
    const vars = withDerivedTokens({
      background: '#1e1e1e',
      'background-secondary': '#2a2a2a',
      foreground: '#f0f0f0',
      'foreground-secondary': '#555555',
    });
    expect(vars['status-offline']).toMatch(
      /^color-mix\(in oklch, var\(--foreground\) \d+%, var\(--background\)\)$/,
    );
    expect(vars['foreground-disabled']).toBe(vars['status-offline']);
    expect(
      withDerivedTokens({ ...vars, 'status-offline': '#888888' })[
        'status-offline'
      ],
    ).toBe('#888888');
    expect(
      withDerivedTokens({
        background: '#1e1e1e',
        foreground: '#f0f0f0',
        'foreground-secondary': '#b0b0b0',
      })['status-offline'],
    ).toBe('var(--foreground-secondary)');
  });

  it('sets color-scheme from the block background', () => {
    expect(colourScheme({ background: '#101010' })).toBe('dark');
    expect(colourScheme({ background: 'oklch(0.97 0.01 90)' })).toBe('light');
    expect(colourScheme({ primary: '#101010' })).toBeNull();
    expect(
      colourScheme({ background: 'var(--surface)' }, { surface: '#000000' }),
    ).toBe('dark');
    expect(
      generateAdvancedThemeCSS({
        version: 1,
        name: 'Always dark',
        vars: { background: '#101010' },
      }),
    ).toContain('color-scheme: dark;');
  });
});
