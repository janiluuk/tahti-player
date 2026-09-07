import { act, render } from '@testing-library/react';

import { CrossfadeSound } from '../CrossfadeSound';
import { AudioSource } from '../types';
import {
  fireMediaCanPlay,
  resetMediaSpies,
  setupAudioContextMock,
} from './test-utils';

const srcA: AudioSource = { url: '/a.mp3', protocol: 'http' };
const srcB: AudioSource = { url: '/b.mp3', protocol: 'http' };

describe('CrossfadeSound', () => {
  it('calls play on next and pauses current after crossfade', async () => {
    const { restore } = setupAudioContextMock();
    const { playMock, pauseMock } = resetMediaSpies();

    vi.useFakeTimers();
    const { rerender, unmount } = render(
      <CrossfadeSound src={srcA} status="playing" crossfadeMs={25} />,
    );

    rerender(<CrossfadeSound src={srcB} status="playing" crossfadeMs={25} />);

    expect(playMock).toHaveBeenCalled();

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(pauseMock).toHaveBeenCalled();

    unmount();
    restore();
    vi.useRealTimers();
  });

  it('applies the volume prop to both audio elements', () => {
    const { restore } = setupAudioContextMock();

    render(<CrossfadeSound src={srcA} status="paused" volume={50} />);

    const audios = document.querySelectorAll('audio');
    expect(audios).toHaveLength(2);
    for (const audio of audios) {
      expect((audio as HTMLAudioElement).volume).toBe(0.5);
    }

    restore();
  });

  it("fires onCanPlay only for the currently-active element's canplay, not the preloading one", async () => {
    const { restore } = setupAudioContextMock();
    const onCanPlay = vi.fn();

    vi.useFakeTimers();
    const { rerender, unmount } = render(
      <CrossfadeSound
        src={srcA}
        status="playing"
        crossfadeMs={25}
        onCanPlay={onCanPlay}
      />,
    );

    rerender(
      <CrossfadeSound
        src={srcB}
        status="playing"
        crossfadeMs={25}
        onCanPlay={onCanPlay}
      />,
    );

    const activeAudio = document.querySelector(
      'audio[data-is-active="true"]',
    ) as HTMLAudioElement;
    const preloadingAudio = document.querySelector(
      'audio[data-is-active="false"]',
    ) as HTMLAudioElement;

    act(() => {
      fireMediaCanPlay(preloadingAudio as HTMLAudioElement);
    });
    expect(onCanPlay).not.toHaveBeenCalled();

    act(() => {
      fireMediaCanPlay(activeAudio as HTMLAudioElement);
    });
    expect(onCanPlay).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    unmount();
    restore();
    vi.useRealTimers();
  });
});
