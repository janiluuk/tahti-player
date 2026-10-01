import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EntitySocialHeader } from './EntitySocialHeader';

vi.mock('./ChannelVisualizer', () => ({ ChannelVisualizer: () => null }));

const renderWith = (placement: 'AVATAR' | 'COVER' | 'BOTH' | null) =>
  render(
    <EntitySocialHeader
      title="Selector"
      imageUrl="https://media.example/avatar.jpg"
      logo={
        placement ? { url: 'https://media.example/logo.png', placement } : null
      }
    />,
  );

describe('EntitySocialHeader logo', () => {
  it('draws the logo on the avatar', () => {
    renderWith('AVATAR');
    expect(screen.getByTestId('header-logo-avatar')).toBeTruthy();
    expect(screen.queryByTestId('header-logo-cover')).toBeNull();
  });

  it('draws the logo on the cover', () => {
    renderWith('COVER');
    expect(screen.getByTestId('header-logo-cover')).toBeTruthy();
    expect(screen.queryByTestId('header-logo-avatar')).toBeNull();
  });

  it('draws it in both places', () => {
    renderWith('BOTH');
    expect(screen.getByTestId('header-logo-avatar').getAttribute('src')).toBe(
      'https://media.example/logo.png',
    );
    expect(screen.getByTestId('header-logo-cover')).toBeTruthy();
  });

  it('draws nothing without a logo', () => {
    renderWith(null);
    expect(screen.queryByTestId('header-logo-avatar')).toBeNull();
    expect(screen.queryByTestId('header-logo-cover')).toBeNull();
  });
});
