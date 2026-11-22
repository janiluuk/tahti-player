import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { VisualizerScheme } from '../plugins/visualizers/types';
import { ChannelVisualizer } from './ChannelVisualizer';

vi.mock('../lib/webgl', () => ({ supportsWebGL: () => true }));
vi.mock('../lib/useDominantColor', () => ({
  useDominantColor: (url: string | null | undefined) =>
    url ? [0, 0, 255] : null,
}));
vi.mock('./visuals/ThreeVisualizer', () => ({
  ThreeVisualizer: ({ scheme }: { scheme: VisualizerScheme }) => (
    <div
      data-testid="three-visualizer"
      data-accent={scheme.accent}
      data-highlight={scheme.highlight}
      data-bg={scheme.bg}
    />
  ),
}));

const CHANNEL_SCHEME = {
  accent: '#FF8800',
  highlight: '#FFEE00',
  bg: '#101010',
};

describe('ChannelVisualizer', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('takes accent and highlight from the track artwork when asked', async () => {
    render(
      <ChannelVisualizer
        preset="AURORA"
        colorScheme={CHANNEL_SCHEME}
        artworkUrl="https://example.test/cover.jpg"
        followArtworkColor
      />,
    );
    const visualizer = await screen.findByTestId('three-visualizer');
    expect(visualizer).toHaveAttribute('data-accent', '#0000FF');
    expect(visualizer).toHaveAttribute('data-highlight', '#CF70FF');
    expect(visualizer).toHaveAttribute('data-bg', CHANNEL_SCHEME.bg);
  });

  it('keeps the channel scheme for other artwork', async () => {
    render(
      <ChannelVisualizer
        preset="AURORA"
        colorScheme={CHANNEL_SCHEME}
        artworkUrl="https://example.test/avatar.jpg"
      />,
    );
    const visualizer = await screen.findByTestId('three-visualizer');
    expect(visualizer).toHaveAttribute('data-accent', CHANNEL_SCHEME.accent);
    expect(visualizer).toHaveAttribute(
      'data-highlight',
      CHANNEL_SCHEME.highlight,
    );
  });
});
