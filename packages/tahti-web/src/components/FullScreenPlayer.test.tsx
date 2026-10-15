// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { useLayoutStore } from '../stores/layoutStore';
import { usePlayerStore } from '../stores/playerStore';
import { FullScreenPlayer } from './FullScreenPlayer';

const stationNowPlaying = vi.hoisted(() => ({
  value: null as { title: string; artist: string } | null,
}));
vi.mock('../hooks/useStationNowPlaying', () => ({
  usePlayerStationNowPlaying: () => stationNowPlaying.value,
}));
vi.mock('./AddToPlaylistButton', () => ({ AddToPlaylistButton: () => null }));
vi.mock('./ChannelVisualizer', () => ({
  ChannelVisualizer: ({
    engineMode,
    showModeButtons,
  }: {
    engineMode?: string;
    showModeButtons?: boolean;
  }) => (
    <div
      data-testid="channel-visualizer"
      data-mode-buttons={String(showModeButtons)}
    >
      {engineMode}
    </div>
  ),
}));
vi.mock('./HearthisEmbedSurface', () => ({ HearthisEmbedSurface: () => null }));
vi.mock('./NowPlayingActionSheet', () => ({
  NowPlayingActionSheet: () => null,
}));
vi.mock('./PlayerSeekBar', () => ({
  ConnectedSeekBar: () => <div>seek bar</div>,
  PlayerLiveIndicator: () => <div>live</div>,
}));

const TRACK: TahtiPlayable = {
  id: 'sound:abc',
  kind: 'sound',
  title: 'Night Drive',
  artist: 'Aino',
  streamUrl: 'https://cdn.example/a.mp3',
  protocol: 'https',
};

async function open(status: 'loading' | 'playing' | 'paused') {
  usePlayerStore.getState().play(TRACK);
  usePlayerStore.setState({ status });
  useLayoutStore.setState({ fullScreenPlayerOpen: true });
  await act(async () => {
    render(<FullScreenPlayer />);
  });
}

describe('FullScreenPlayer buffering', () => {
  beforeEach(() => {
    usePlayerStore.getState().clearQueue();
  });

  afterEach(() => {
    cleanup();
    useLayoutStore.setState({ fullScreenPlayerOpen: false });
    usePlayerStore.getState().clearQueue();
  });

  it('says it is buffering and spins the play button while the stream loads', async () => {
    await open('loading');
    expect(screen.getByRole('status').textContent).toBe('Buffering…');
    expect(screen.getByTestId('player-loading-spinner')).toBeTruthy();
    expect(
      screen.getByTestId('player-pause-button').getAttribute('aria-busy'),
    ).toBe('true');
  });

  it('clears both once audio is playing', async () => {
    await open('loading');
    act(() => {
      usePlayerStore.setState({ status: 'playing' });
    });
    expect(screen.getByRole('status').textContent).toBe('');
    expect(screen.queryByTestId('player-loading-spinner')).toBeNull();
    expect(screen.getByTestId('player-pause-button')).toBeTruthy();
  });

  it('shows neither while paused', async () => {
    await open('paused');
    expect(screen.getByRole('status').textContent).toBe('');
    expect(screen.getByTestId('player-play-button')).toBeTruthy();
  });
});

describe('FullScreenPlayer visualizer menu', () => {
  beforeEach(() => {
    localStorage.clear();
    usePlayerStore.getState().clearQueue();
  });

  afterEach(() => {
    cleanup();
    useLayoutStore.setState({ fullScreenPlayerOpen: false });
    usePlayerStore.getState().clearQueue();
    localStorage.clear();
  });

  it('keeps the visualizer a plain backdrop with no controls of its own', async () => {
    await open('playing');
    const backdrop = screen.getByTestId('channel-visualizer');
    expect(backdrop.textContent).toBe('spectrum');
    expect(backdrop.getAttribute('data-mode-buttons')).toBe('false');
  });

  it('opens a menu of every visualizer from the top bar', async () => {
    await open('playing');
    expect(screen.queryByTestId('visualizer-mode-menu')).toBeNull();

    fireEvent.click(screen.getByTestId('visualizer-mode-trigger'));

    const menu = await screen.findByTestId('visualizer-mode-menu');
    const items = within(menu).getAllByRole('menuitemradio');
    expect(items.map((item) => item.textContent)).toEqual([
      'Oscilloscope',
      'Spectrum',
      'Radial',
      'Quantum Lattice',
      'Orb',
      'Cymatics',
      'Landscape Chrome',
      'Landscape Ferrofluid',
    ]);
    expect(
      within(menu)
        .getByRole('menuitemradio', { name: 'Spectrum' })
        .getAttribute('aria-checked'),
    ).toBe('true');
  });

  it('switches the visualizer and remembers the choice for that track', async () => {
    await open('playing');
    fireEvent.click(screen.getByTestId('visualizer-mode-trigger'));
    const menu = await screen.findByTestId('visualizer-mode-menu');

    fireEvent.click(within(menu).getByRole('menuitemradio', { name: 'Orb' }));

    expect(screen.getByTestId('channel-visualizer').textContent).toBe('orb');
    expect(
      within(menu)
        .getByRole('menuitemradio', { name: 'Orb' })
        .getAttribute('aria-checked'),
    ).toBe('true');
    expect(
      within(menu)
        .getByRole('menuitemradio', { name: 'Spectrum' })
        .getAttribute('aria-checked'),
    ).toBe('false');
    expect(
      screen.getByTestId('visualizer-mode-trigger').getAttribute('aria-label'),
    ).toBe('Visualizer: Orb');
    expect(localStorage.getItem('tahti.viz.channel.abc')).toBe('orb');
  });
});

describe('FullScreenPlayer radio programme', () => {
  afterEach(() => {
    cleanup();
    stationNowPlaying.value = null;
    useLayoutStore.setState({ fullScreenPlayerOpen: false });
    usePlayerStore.getState().clearQueue();
  });

  it('shows what the station says is on, with the station name second', async () => {
    stationNowPlaying.value = {
      title: 'Aamulähetys · Juontaja',
      artist: 'YleX',
    };
    await open('playing');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Aamulähetys · Juontaja',
    );
    expect(screen.getByText('YleX')).toBeTruthy();
  });
});

describe('FullScreenPlayer full screen button', () => {
  const requestFullscreen = vi.fn();
  const exitFullscreen = vi.fn();
  let fullscreenElement: Element | null = null;

  beforeEach(() => {
    fullscreenElement = null;
    requestFullscreen.mockImplementation(() => {
      fullscreenElement = document.documentElement;
      document.dispatchEvent(new Event('fullscreenchange'));
      return Promise.resolve();
    });
    exitFullscreen.mockImplementation(() => {
      fullscreenElement = null;
      document.dispatchEvent(new Event('fullscreenchange'));
      return Promise.resolve();
    });
    Object.defineProperty(document, 'fullscreenEnabled', {
      configurable: true,
      get: () => true,
    });
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => fullscreenElement,
    });
    document.exitFullscreen = exitFullscreen;
    document.documentElement.requestFullscreen = requestFullscreen;
  });

  afterEach(() => {
    cleanup();
    useLayoutStore.setState({ fullScreenPlayerOpen: false });
    usePlayerStore.getState().clearQueue();
    Reflect.deleteProperty(document, 'fullscreenEnabled');
    Reflect.deleteProperty(document, 'fullscreenElement');
  });

  it('fills the screen and goes back', async () => {
    await open('playing');
    fireEvent.click(screen.getByRole('button', { name: 'Full screen' }));
    expect(requestFullscreen).toHaveBeenCalled();

    const exit = await screen.findByRole('button', {
      name: 'Exit full screen',
    });
    expect(exit.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(exit);
    expect(exitFullscreen).toHaveBeenCalled();
    expect(
      await screen.findByRole('button', { name: 'Full screen' }),
    ).toBeTruthy();
  });

  it('leaves full screen when the player is minimized', async () => {
    await open('playing');
    fireEvent.click(screen.getByRole('button', { name: 'Full screen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Minimize player' }));
    expect(exitFullscreen).toHaveBeenCalled();
  });

  it('has no button where the browser cannot go full screen', async () => {
    Object.defineProperty(document, 'fullscreenEnabled', {
      configurable: true,
      get: () => false,
    });
    await open('playing');
    expect(screen.queryByRole('button', { name: 'Full screen' })).toBeNull();
  });
});
