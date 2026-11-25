// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import {
  PHONE_PLAYER_MINIMIZED_KEY,
  resetPhonePlayerMinimizedCache,
} from '../hooks/usePhonePlayerMinimized';
import { usePlayerStore } from '../stores/playerStore';
import { ConnectedPlayerBar } from './ConnectedPlayerBar';

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => vi.fn(),
}));
vi.mock('./PlayerSeekBar', () => ({
  ConnectedSeekBar: () => <div>seek bar</div>,
  PlayerLiveBadge: () => <span>live</span>,
}));
vi.mock('./SidebarQueuePanel', () => ({ SidebarQueuePanel: () => null }));

const TRACK: TahtiPlayable = {
  id: 'sound:abc',
  kind: 'sound',
  title: 'Night Drive',
  artist: 'Aino',
  streamUrl: 'https://cdn.example/a.mp3',
  protocol: 'https',
};

const realMatchMedia = window.matchMedia;

function stubViewport(phone: boolean) {
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
}

async function renderBar() {
  await act(async () => {
    render(<ConnectedPlayerBar />);
  });
}

const bar = () => screen.getByTestId('mobile-player-bar');
const minimizeButton = () =>
  screen.queryByRole('button', { name: 'Minimize player' });

describe('ConnectedPlayerBar minimize on a phone', () => {
  beforeEach(() => {
    stubViewport(true);
    localStorage.removeItem(PHONE_PLAYER_MINIMIZED_KEY);
    resetPhonePlayerMinimizedCache();
    usePlayerStore.getState().clearQueue();
    usePlayerStore.getState().playFromList([TRACK], 0);
    usePlayerStore.setState({ status: 'playing' });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.matchMedia = realMatchMedia;
    localStorage.removeItem(PHONE_PLAYER_MINIMIZED_KEY);
    resetPhonePlayerMinimizedCache();
    usePlayerStore.getState().clearQueue();
  });

  it('collapses to a mini strip that still plays and pauses', async () => {
    await renderBar();
    expect(bar()).not.toHaveAttribute('data-minimized');
    expect(screen.getByText('seek bar')).toBeInTheDocument();

    fireEvent.click(minimizeButton()!);
    expect(bar()).toHaveAttribute('data-minimized');
    expect(screen.queryByText('seek bar')).toBeNull();
    expect(minimizeButton()).toBeNull();
    expect(screen.getByText('Night Drive')).toBeInTheDocument();
    expect(localStorage.getItem(PHONE_PLAYER_MINIMIZED_KEY)).toBe('1');

    fireEvent.click(screen.getByTestId('player-pause-button'));
    expect(usePlayerStore.getState().status).toBe('paused');
  });

  it('restores from a tap on the strip and forgets the choice', async () => {
    await renderBar();
    fireEvent.click(minimizeButton()!);
    fireEvent.click(
      screen.getByRole('button', { name: 'Show full player: Night Drive' }),
    );
    expect(bar()).not.toHaveAttribute('data-minimized');
    expect(minimizeButton()).toBeInTheDocument();
    expect(localStorage.getItem(PHONE_PLAYER_MINIMIZED_KEY)).toBeNull();
  });

  it('remembers the minimized choice across reloads', async () => {
    localStorage.setItem(PHONE_PLAYER_MINIMIZED_KEY, '1');
    resetPhonePlayerMinimizedCache();
    await renderBar();
    expect(bar()).toHaveAttribute('data-minimized');
    fireEvent.click(screen.getByTestId('expand-mobile-player-bar'));
    expect(bar()).not.toHaveAttribute('data-minimized');
  });

  it('still minimizes when storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    resetPhonePlayerMinimizedCache();
    await renderBar();
    fireEvent.click(minimizeButton()!);
    expect(bar()).toHaveAttribute('data-minimized');
  });

  it('moves minimize and close into the more menu while paused', async () => {
    usePlayerStore.setState({ status: 'paused' });
    await renderBar();
    expect(minimizeButton()).toBeNull();
    expect(screen.queryByRole('button', { name: 'Close player' })).toBeNull();

    fireEvent.click(screen.getByTestId('mobile-player-more'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Minimize player' }),
    );
    expect(bar()).toHaveAttribute('data-minimized');
  });

  it('draws mini strip progress without re-rendering the bar', async () => {
    localStorage.setItem(PHONE_PLAYER_MINIMIZED_KEY, '1');
    resetPhonePlayerMinimizedCache();
    usePlayerStore.setState({ currentTime: 30, duration: 120 });
    await renderBar();
    const fill = screen.getByTestId('mini-player-progress-fill');
    expect(fill.style.transform).toBe('scaleX(0.25)');
    act(() => usePlayerStore.getState().setProgress(60, 120));
    expect(fill.style.transform).toBe('scaleX(0.5)');
  });

  it('keeps the full bar on desktop even when minimized on a phone before', async () => {
    localStorage.setItem(PHONE_PLAYER_MINIMIZED_KEY, '1');
    resetPhonePlayerMinimizedCache();
    stubViewport(false);
    await renderBar();
    expect(screen.queryByTestId('mobile-player-bar')).toBeNull();
    expect(minimizeButton()).toBeNull();
    expect(screen.getByTestId('now-playing-title')).toHaveTextContent(
      'Night Drive',
    );
  });
});
