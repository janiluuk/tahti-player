// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
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
const NEXT: TahtiPlayable = { ...TRACK, id: 'sound:def', title: 'Day Ride' };

const realMatchMedia = window.matchMedia;

function stubPhone() {
  window.matchMedia = ((query: string) => ({
    matches: query === '(max-width: 767px)',
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

const closeButton = () =>
  screen.queryByRole('button', { name: 'Close player' });

describe('ConnectedPlayerBar close on a phone', () => {
  beforeEach(() => {
    stubPhone();
    usePlayerStore.getState().clearQueue();
    usePlayerStore.getState().playFromList([TRACK, NEXT], 0);
  });

  afterEach(() => {
    cleanup();
    window.matchMedia = realMatchMedia;
    usePlayerStore.getState().clearQueue();
  });

  it('offers no close while something plays or loads', async () => {
    usePlayerStore.setState({ status: 'playing' });
    await renderBar();
    expect(screen.getByTestId('mobile-player-bar')).toBeInTheDocument();
    expect(closeButton()).toBeNull();

    act(() => usePlayerStore.setState({ status: 'loading' }));
    expect(closeButton()).toBeNull();
  });

  it('hides the bar when closed while paused and keeps the queue', async () => {
    usePlayerStore.setState({ status: 'paused' });
    await renderBar();
    const close = closeButton()!;
    expect(close).toBeInTheDocument();
    expect(close.className).toContain('size-11');

    fireEvent.click(close);
    expect(screen.queryByTestId('mobile-player-bar')).toBeNull();
    const state = usePlayerStore.getState();
    expect(state.queue.map((q) => q.id)).toEqual(['sound:abc', 'sound:def']);
    expect(state.currentId).toBe('sound:abc');
  });

  it('can be closed from the keyboard', async () => {
    usePlayerStore.setState({ status: 'idle' });
    await renderBar();
    const user = userEvent.setup();
    const close = closeButton()!;
    for (let i = 0; i < 10 && document.activeElement !== close; i++) {
      await user.tab();
    }
    expect(document.activeElement).toBe(close);
    await user.keyboard('{Enter}');
    expect(screen.queryByTestId('mobile-player-bar')).toBeNull();
  });

  it('comes back when playback resumes', async () => {
    usePlayerStore.setState({ status: 'paused' });
    await renderBar();
    fireEvent.click(closeButton()!);
    expect(screen.queryByTestId('mobile-player-bar')).toBeNull();

    act(() => usePlayerStore.getState().setStatus('playing'));
    expect(screen.getByTestId('mobile-player-bar')).toBeInTheDocument();
    expect(closeButton()).toBeNull();
  });

  it('comes back when another track is played', async () => {
    usePlayerStore.setState({ status: 'paused' });
    await renderBar();
    fireEvent.click(closeButton()!);

    act(() => usePlayerStore.getState().playQueueIndex('sound:def'));
    expect(screen.getByTestId('mobile-player-bar')).toBeInTheDocument();
    expect(screen.getByText('Day Ride')).toBeInTheDocument();
  });
});
