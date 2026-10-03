import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePlayerStore } from '../../stores/playerStore';
import {
  ArtistBackgroundMusicButton,
  BACKGROUND_MUSIC_VOLUME,
} from './ArtistBackgroundMusicButton';

class FakeAudio {
  static instances: FakeAudio[] = [];
  src: string;
  loop = false;
  volume = 1;
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  removeAttribute = vi.fn();
  constructor(src: string) {
    this.src = src;
    FakeAudio.instances.push(this);
  }
}

const URL = 'https://cdn.example/bg.mp3';

describe('ArtistBackgroundMusicButton', () => {
  beforeEach(() => {
    FakeAudio.instances = [];
    vi.stubGlobal('Audio', FakeAudio);
    usePlayerStore.setState({ status: 'idle' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders nothing without a clip URL', () => {
    render(<ArtistBackgroundMusicButton url={null} artistName="Selector" />);
    expect(screen.queryByTestId('artist-background-music-button')).toBeNull();
  });

  it('does not autoplay and starts a quiet loop on click', async () => {
    render(<ArtistBackgroundMusicButton url={URL} artistName="Selector" />);
    expect(FakeAudio.instances).toHaveLength(0);

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: "Play Selector's background music",
        }),
      );
    });

    const [audio] = FakeAudio.instances;
    expect(audio.src).toBe(URL);
    expect(audio.loop).toBe(true);
    expect(audio.volume).toBe(BACKGROUND_MUSIC_VOLUME);
    expect(audio.play).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByRole('button', { name: "Mute Selector's background music" }),
    );
    expect(audio.pause).toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: "Play Selector's background music" }),
    ).toBeTruthy();
  });

  it('pauses when the main player starts a track', async () => {
    render(<ArtistBackgroundMusicButton url={URL} artistName="Selector" />);
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: "Play Selector's background music",
        }),
      );
    });
    const [audio] = FakeAudio.instances;

    act(() => {
      usePlayerStore.setState({ status: 'loading' });
    });

    expect(audio.pause).toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: "Play Selector's background music" }),
    ).toBeTruthy();
  });

  it('pauses the main player before starting the clip', async () => {
    usePlayerStore.setState({ status: 'playing' });
    render(<ArtistBackgroundMusicButton url={URL} artistName="Selector" />);
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: "Play Selector's background music",
        }),
      );
    });
    const [audio] = FakeAudio.instances;
    expect(usePlayerStore.getState().status).toBe('paused');
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(audio.pause).not.toHaveBeenCalled();
  });

  it('stops the clip on unmount', async () => {
    const { unmount } = render(
      <ArtistBackgroundMusicButton url={URL} artistName="Selector" />,
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: "Play Selector's background music",
        }),
      );
    });
    const [audio] = FakeAudio.instances;
    unmount();
    expect(audio.pause).toHaveBeenCalled();
  });

  it('resets when the play request is rejected', async () => {
    render(<ArtistBackgroundMusicButton url={URL} artistName="Selector" />);
    vi.stubGlobal(
      'Audio',
      class extends FakeAudio {
        play = vi.fn(() => Promise.reject(new Error('NotAllowedError')));
      },
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: "Play Selector's background music",
        }),
      );
    });
    expect(
      screen.getByRole('button', { name: "Play Selector's background music" }),
    ).toBeTruthy();
  });
});
