import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setBackdropFrameVerdict } from '../lib/backdropMotion';
import type { VisualizerScheme } from '../plugins/visualizers/types';
import { ChannelVisualizer } from './ChannelVisualizer';

const webgl = vi.hoisted(() => ({ software: false }));
vi.mock('../lib/webgl', () => ({
  supportsWebGL: () => true,
  hasSoftwareWebGL: () => webgl.software,
}));
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
    webgl.software = false;
  });

  it('keeps a software-rendered backdrop still and animates a stage', async () => {
    webgl.software = true;
    const { container, unmount } = render(
      <ChannelVisualizer
        preset="AURORA"
        colorScheme={CHANNEL_SCHEME}
        backdrop
      />,
    );
    expect(screen.queryByTestId('three-visualizer')).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    unmount();

    render(<ChannelVisualizer preset="AURORA" colorScheme={CHANNEL_SCHEME} />);
    expect(await screen.findByTestId('three-visualizer')).toBeInTheDocument();
  });

  it('drops an animated backdrop to the still gradient when frames drop', async () => {
    render(
      <>
        <ChannelVisualizer
          preset="AURORA"
          colorScheme={CHANNEL_SCHEME}
          backdrop
        />
        <ChannelVisualizer
          preset="AURORA"
          colorScheme={CHANNEL_SCHEME}
          backdrop
          stillWhenFramesDrop={false}
        />
      </>,
    );
    expect(await screen.findAllByTestId('three-visualizer')).toHaveLength(2);
    act(() => setBackdropFrameVerdict('slow'));
    expect(screen.getAllByTestId('three-visualizer')).toHaveLength(1);
    act(() => setBackdropFrameVerdict('pending'));
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
