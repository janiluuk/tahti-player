import { describe, expect, it } from 'vitest';

import {
  artistHeroImage,
  avatarThemeCss,
  readAvatarTheme,
  sameAvatarTheme,
} from './avatarTheme';
import { placeholderArtworkUrl } from './placeholderArt';

describe('readAvatarTheme', () => {
  it('reads a gradient theme', () => {
    expect(
      readAvatarTheme({
        kind: 'gradient',
        colors: ['#A78BFA', '#22D3EE'],
        angle: 135,
      }),
    ).toEqual({ kind: 'gradient', colors: ['#A78BFA', '#22D3EE'], angle: 135 });
  });

  it('drops anything the API would not have stored', () => {
    expect(readAvatarTheme(null)).toBeNull();
    expect(readAvatarTheme('#22D3EE')).toBeNull();
    expect(readAvatarTheme({ kind: 'radial', colors: ['#22D3EE'] })).toBeNull();
    expect(readAvatarTheme({ kind: 'solid', colors: [] })).toBeNull();
    expect(readAvatarTheme({ kind: 'solid', colors: ['red'] })).toBeNull();
    expect(
      readAvatarTheme({ kind: 'solid', colors: ['url(x)', '#22D3EE'] }),
    ).toBeNull();
    expect(
      readAvatarTheme({ kind: 'gradient', colors: ['#22D3EE'], angle: 400 }),
    ).toBeNull();
  });
});

describe('avatarThemeCss', () => {
  it('paints a solid colour', () => {
    expect(avatarThemeCss({ kind: 'solid', colors: ['#22D3EE'] })).toBe(
      '#22D3EE',
    );
  });

  it('paints a gradient, defaulting the angle to 135deg', () => {
    expect(
      avatarThemeCss({ kind: 'gradient', colors: ['#A78BFA', '#22D3EE'] }),
    ).toBe('linear-gradient(135deg, #A78BFA, #22D3EE)');
  });
});

describe('sameAvatarTheme', () => {
  it('treats two missing themes as the same', () => {
    expect(sameAvatarTheme(null, undefined)).toBe(true);
    expect(sameAvatarTheme(null, { kind: 'solid', colors: ['#22D3EE'] })).toBe(
      false,
    );
  });
});

describe('artistHeroImage', () => {
  const theme = { kind: 'solid', colors: ['#22D3EE'] };

  it('prefers the profile picture', () => {
    expect(
      artistHeroImage({
        username: 'sel',
        avatarUrl: 'https://cdn/a.jpg',
        avatarTheme: theme,
      }),
    ).toEqual({ imageUrl: 'https://cdn/a.jpg', imageFallback: null });
  });

  it('fills a missing picture with the avatar theme', () => {
    expect(
      artistHeroImage({ username: 'sel', avatarUrl: null, avatarTheme: theme }),
    ).toEqual({ imageUrl: null, imageFallback: '#22D3EE' });
  });

  it('keeps the generated artwork when the API sends no theme', () => {
    expect(artistHeroImage({ username: 'sel', avatarUrl: null })).toEqual({
      imageUrl: placeholderArtworkUrl('sel'),
      imageFallback: null,
    });
  });
});
