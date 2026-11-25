// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import * as likes from '../api/likes';
import * as engagement from '../api/sound-engagement';
import type { TahtiPlayable } from '../api/types';
import { useAuthStore } from '../stores/authStore';
import { useLayoutStore } from '../stores/layoutStore';
import { usePlayerStore } from '../stores/playerStore';
import { useSoundLikesStore } from '../stores/soundLikesStore';
import { FullScreenPlayer } from './FullScreenPlayer';

const stationNowPlaying = vi.hoisted(() => ({
  value: null as { title: string; artist: string } | null,
}));
const dominantColor = vi.hoisted(() => ({ url: null as string | null }));
vi.mock('../hooks/useStationNowPlaying', () => ({
  usePlayerStationNowPlaying: () => stationNowPlaying.value,
}));
vi.mock('../lib/useDominantColor', () => ({
  useDominantColor: (url: string | null) => {
    dominantColor.url = url;
    return [24, 96, 168];
  },
}));
vi.mock('./AddToPlaylistButton', () => ({
  AddToPlaylistButton: () => <button type="button">Add to playlist</button>,
}));
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
vi.mock('./EmbedSurface', () => ({ EmbedSurface: () => null }));
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

describe('FullScreenPlayer living artwork', () => {
  afterEach(() => {
    cleanup();
    useLayoutStore.setState({ fullScreenPlayerOpen: false });
    usePlayerStore.getState().clearQueue();
    dominantColor.url = null;
  });

  it('moves a colour-glowing cover panel and exposes the chosen title transition', async () => {
    usePlayerStore.getState().play({ ...TRACK, coverUrl: '/cover.jpg' });
    usePlayerStore.setState({ status: 'playing' });
    useLayoutStore.setState({ fullScreenPlayerOpen: true });
    await act(async () => {
      render(<FullScreenPlayer titleTransition="slide-up" />);
    });

    const panel = screen.getByTestId('full-screen-player-cover-panel');
    expect(panel).toHaveAttribute('data-cover-glow', 'true');
    expect(panel.style.boxShadow).toContain('rgba(24, 96, 168, 0.3)');
    expect(screen.getByTestId('full-screen-player-title')).toHaveAttribute(
      'data-transition',
      'slide-up',
    );
  });

  it.each(['fade', 'slide-up', 'soft-scale', 'slide-side'] as const)(
    'offers the %s title transition',
    async (titleTransition) => {
      usePlayerStore.getState().play(TRACK);
      usePlayerStore.setState({ status: 'playing' });
      useLayoutStore.setState({ fullScreenPlayerOpen: true });
      await act(async () => {
        render(<FullScreenPlayer titleTransition={titleTransition} />);
      });
      expect(screen.getByTestId('full-screen-player-title')).toHaveAttribute(
        'data-transition',
        titleTransition,
      );
      cleanup();
    },
  );

  it('uses the default artwork for the panel, backdrop and colour sample', async () => {
    usePlayerStore.getState().play(TRACK);
    usePlayerStore.setState({ status: 'playing' });
    useLayoutStore.setState({ fullScreenPlayerOpen: true });
    await act(async () => {
      render(<FullScreenPlayer />);
    });

    const src = screen
      .getByTestId('full-screen-player-cover-panel')
      .querySelector('img')
      ?.getAttribute('src');
    expect(src).toMatch(/^data:image\/svg\+xml/);
    expect(dominantColor.url).toBe(src);
  });
});

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
    expect(within(menu).getAllByTestId('visualizer-mode-preview')).toHaveLength(
      8,
    );
    const items = within(menu).getAllByRole('menuitemradio');
    expect(items.map((item) => item.textContent)).toEqual([
      'Off (cover glow)',
      'Water landscape',
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

  it('turns the visualizer off for a cover-art water landscape and remembers it', async () => {
    await open('playing');
    fireEvent.click(screen.getByTestId('visualizer-mode-trigger'));
    const menu = await screen.findByTestId('visualizer-mode-menu');

    fireEvent.click(within(menu).getByTestId('visualizer-scene-ambient-water'));

    expect(screen.queryByTestId('channel-visualizer')).toBeNull();
    expect(screen.getByTestId('cover-ambience')).toHaveAttribute(
      'data-variant',
      'water',
    );
    expect(
      screen.getByTestId('visualizer-mode-trigger').getAttribute('aria-label'),
    ).toBe('Visualizer: Water landscape');
    expect(localStorage.getItem('tahti.viz.channel.abc')).toBe('ambient-water');
  });
});

describe('FullScreenPlayer radio programme', () => {
  afterEach(() => {
    cleanup();
    stationNowPlaying.value = null;
    useLayoutStore.setState({ fullScreenPlayerOpen: false });
    usePlayerStore.getState().clearQueue();
  });

  it('shows the station as the show line and the programme as the track', async () => {
    stationNowPlaying.value = {
      title: 'Aamulähetys · Juontaja',
      artist: 'YleX',
    };
    await open('playing');
    const titleBlock = screen.getByTestId('full-screen-player-title');
    expect(within(titleBlock).getByText('YleX')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Aamulähetys · Juontaja',
    );
  });

  it('splits a show — track programme into separate lines', async () => {
    stationNowPlaying.value = {
      title: 'Iltapäivä — Night Drive',
      artist: 'YleX',
    };
    await open('playing');
    const titleBlock = screen.getByTestId('full-screen-player-title');
    expect(within(titleBlock).getByText('YleX')).toBeTruthy();
    expect(within(titleBlock).getByText('Iltapäivä')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Night Drive',
    );
  });
});

describe('splitShowAndTrack', () => {
  it('keeps plain titles as the track', async () => {
    const { splitShowAndTrack } = await import('./FullScreenPlayer');
    expect(splitShowAndTrack('Night Drive')).toEqual({
      show: null,
      track: 'Night Drive',
    });
  });

  it('splits on an em dash', async () => {
    const { splitShowAndTrack } = await import('./FullScreenPlayer');
    expect(splitShowAndTrack('Aamu — Track One')).toEqual({
      show: 'Aamu',
      track: 'Track One',
    });
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

  it('fills the screen into driving mode and goes back', async () => {
    await open('playing');
    fireEvent.click(
      screen.getByRole('button', { name: 'Driving mode (full screen)' }),
    );
    expect(requestFullscreen).toHaveBeenCalled();

    const exit = await screen.findByRole('button', {
      name: 'Exit full screen',
    });
    expect(exit.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('full-screen-player')).toHaveAttribute(
      'data-driving',
      'true',
    );
    expect(screen.getByTestId('driving-prev')).toBeTruthy();
    expect(screen.queryByTestId('player-shuffle-button')).toBeNull();
    fireEvent.click(exit);
    expect(exitFullscreen).toHaveBeenCalled();
    expect(
      await screen.findByRole('button', {
        name: 'Driving mode (full screen)',
      }),
    ).toBeTruthy();
  });

  it('leaves full screen when the player is minimized', async () => {
    await open('playing');
    fireEvent.click(
      screen.getByRole('button', { name: 'Driving mode (full screen)' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Minimize player' }));
    expect(exitFullscreen).toHaveBeenCalled();
  });

  it('has no button where the browser cannot go full screen', async () => {
    Object.defineProperty(document, 'fullscreenEnabled', {
      configurable: true,
      get: () => false,
    });
    await open('playing');
    expect(
      screen.queryByRole('button', { name: 'Driving mode (full screen)' }),
    ).toBeNull();
  });

  it('changes track on a horizontal swipe of the stage', async () => {
    usePlayerStore
      .getState()
      .playFromList(
        [TRACK, { ...TRACK, id: 'sound:def', title: 'Day Ride' }],
        0,
      );
    usePlayerStore.setState({ status: 'playing' });
    useLayoutStore.setState({ fullScreenPlayerOpen: true });
    await act(async () => {
      render(<FullScreenPlayer />);
    });

    const stage = screen.getByTestId('full-screen-player-stage');
    const swipe = (type: string, clientX: number) => {
      const event = new Event(type, { bubbles: true }) as Event & {
        clientX: number;
        clientY: number;
        pointerId: number;
        pointerType: string;
        isPrimary: boolean;
      };
      Object.assign(event, {
        clientX,
        clientY: 100,
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
      });
      fireEvent(stage, event);
    };
    await act(async () => {
      swipe('pointerdown', 200);
      swipe('pointerup', 80);
    });
    expect(usePlayerStore.getState().currentId).toBe('sound:def');
  });
});

describe('FullScreenPlayer on a phone', () => {
  const realMatchMedia = window.matchMedia;

  const stubWidth = (phone: boolean) => {
    window.matchMedia = ((query: string) => ({
      matches: phone && query === '(max-width: 767px)',
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
  };

  beforeEach(() => {
    usePlayerStore.getState().clearQueue();
    vi.spyOn(likes, 'fetchMyLikes').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    useAuthStore.setState({
      user: {
        id: 'user-1',
        email: '',
        username: 'demo',
        displayName: 'Demo',
        role: 'LISTENER',
        isBoard: false,
        isMember: true,
      },
      hydrated: true,
      loading: false,
    });
  });

  afterEach(() => {
    cleanup();
    window.matchMedia = realMatchMedia;
    useLayoutStore.setState({ fullScreenPlayerOpen: false });
    usePlayerStore.getState().clearQueue();
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
    useSoundLikesStore.getState().reset();
    vi.restoreAllMocks();
  });

  it('shows Love instead of Add to playlist and toggles the like', async () => {
    stubWidth(true);
    const like = vi
      .spyOn(engagement, 'setSoundEngagement')
      .mockResolvedValue({ ok: true, data: { active: true, count: 1 } });
    vi.spyOn(client, 'fetchTrackDetail').mockResolvedValue({
      data: { channelSlug: 'aino' },
    } as Awaited<ReturnType<typeof client.fetchTrackDetail>>);
    usePlayerStore.getState().play(TRACK);
    usePlayerStore.setState({ status: 'playing' });
    useLayoutStore.setState({ fullScreenPlayerOpen: true });
    await act(async () => {
      render(<FullScreenPlayer />);
    });

    expect(
      screen.queryByRole('button', { name: 'Add to playlist' }),
    ).toBeNull();
    const love = screen.getByRole('button', { name: 'Like Night Drive' });
    expect(love).toHaveAttribute('aria-pressed', 'false');
    await act(async () => {
      fireEvent.click(love);
    });
    await waitFor(() =>
      expect(like).toHaveBeenCalledWith('like', 'aino', 'abc', true),
    );
    expect(
      await screen.findByRole('button', { name: 'Unlike Night Drive' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('has no Add to playlist button on wider screens either; it lives in the ⋯ menu', async () => {
    stubWidth(false);
    await open('playing');
    expect(
      screen.queryByRole('button', { name: 'Add to playlist' }),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: /^More options for/ }),
    ).toBeInTheDocument();
  });
});
