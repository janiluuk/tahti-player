import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { avatarPoster } from '../lib/avatarPoster';
import { EntitySocialHeader } from './EntitySocialHeader';

vi.mock('./ChannelVisualizer', () => ({ ChannelVisualizer: () => null }));

const GIF = 'https://media.example/avatar.gif';
const POSTER = 'https://media.example/avatar-poster.png';

const avatarSrc = () =>
  screen.getByTestId('media-artwork').querySelector('img')?.getAttribute('src');

describe('EntitySocialHeader animated avatar', () => {
  it('shows the poster until the avatar is hovered', () => {
    render(
      <EntitySocialHeader
        title="Selector"
        imageUrl={GIF}
        imagePosterUrl={POSTER}
      />,
    );
    expect(avatarSrc()).toBe(POSTER);
    fireEvent.pointerEnter(screen.getByTestId('media-artwork'));
    expect(avatarSrc()).toBe(GIF);
  });

  it('plays while the avatar button has keyboard focus', () => {
    render(
      <EntitySocialHeader
        title="Selector"
        imageUrl={GIF}
        imagePosterUrl={POSTER}
        onImageClick={() => {}}
      />,
    );
    const button = screen.getByRole('button', {
      name: 'Change Selector artwork',
    });
    fireEvent.focus(button);
    expect(avatarSrc()).toBe(GIF);
    fireEvent.blur(button);
    expect(avatarSrc()).toBe(POSTER);
  });
});

describe('avatarPoster', () => {
  it('uses the poster only alongside the avatar it belongs to', () => {
    expect(avatarPoster({ avatarUrl: GIF, avatarPosterUrl: POSTER })).toBe(
      POSTER,
    );
    expect(avatarPoster({ avatarUrl: null, avatarPosterUrl: POSTER })).toBe(
      null,
    );
    expect(avatarPoster({ avatarUrl: GIF })).toBe(null);
  });
});
