import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EntitySocialHeader } from './EntitySocialHeader';

vi.mock('./ChannelVisualizer', () => ({ ChannelVisualizer: () => null }));

describe('EntitySocialHeader avatar fallback', () => {
  it('fills a missing image with the avatar theme and the initial', () => {
    render(
      <EntitySocialHeader
        title="selector"
        roundImage
        imageFallback="linear-gradient(135deg, #A78BFA, #22D3EE)"
      />,
    );
    const fallback = screen.getByTestId('media-artwork-fallback');
    expect(fallback.style.background).toContain('linear-gradient');
    expect(fallback.textContent).toBe('S');
  });

  it('shows the initial when there is no image and no theme', () => {
    render(<EntitySocialHeader title="kuudes Linja" />);
    expect(screen.getByTestId('media-artwork-fallback').textContent).toBe('K');
  });

  it('shows the image instead when there is one', () => {
    render(
      <EntitySocialHeader
        title="Selector"
        imageUrl="https://media.example/avatar.jpg"
        imageFallback="#22D3EE"
      />,
    );
    expect(screen.queryByTestId('media-artwork-fallback')).toBeNull();
  });
});
