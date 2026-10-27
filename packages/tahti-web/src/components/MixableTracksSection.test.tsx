import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  NativeLibraryTrack,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { useDjPrefsStore } from '../stores/djPrefsStore';
import { MixableTracksSection } from './MixableTracksSection';

function track(
  id: string,
  title: string,
  bpm: number | null,
  musicalKey: string | null,
): NativeLibraryTrack {
  return {
    id,
    title,
    artist: 'Artist',
    bpm,
    musicalKey,
    available: true,
  } as never;
}

function libraryWith(found: NativeLibraryTrack[]) {
  const evaluate = vi.fn((_id: string | null, definition) =>
    Promise.resolve({
      tracks: found.filter(
        (item) =>
          definition.rules[0].field !== 'key' ||
          item.musicalKey === definition.rules[0].value,
      ),
      total: found.length,
    }),
  );
  return {
    library: {
      analysis: { smart: { evaluate } },
    } as unknown as TahtiNativeLibrary,
    evaluate,
  };
}

beforeEach(() => {
  useDjPrefsStore.setState({
    keyNotation: 'camelot',
    bpmTolerance: 6,
    halfDouble: false,
  });
});

describe('MixableTracksSection', () => {
  it('lists neighbouring keys in the chosen notation with the tempo change', async () => {
    const { library } = libraryWith([
      track('b', 'Wheel Up', 130, 'Em'),
      track('c', 'Same Key', 128, 'Am'),
    ]);
    const onPlay = vi.fn();
    render(
      <MixableTracksSection
        library={library}
        track={track('a', 'Source', 128, 'Am')}
        onPlay={onPlay}
        onQueue={vi.fn()}
      />,
    );
    const first = await screen.findByText('Same Key');
    expect(first.closest('li')).toHaveTextContent(
      '8A · 128 BPM · same tempo · Same key',
    );
    expect(screen.getByText('Wheel Up').closest('li')).toHaveTextContent(
      '9A · 130 BPM · +1.6% · One up the wheel',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Play Wheel Up' }));
    expect(onPlay).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }));
  });

  it('says when a match is at half tempo', async () => {
    useDjPrefsStore.setState({ halfDouble: true });
    const { library } = libraryWith([track('h', 'Halftime', 65, 'Am')]);
    render(
      <MixableTracksSection
        library={library}
        track={track('a', 'Source', 128, 'Am')}
        onPlay={vi.fn()}
        onQueue={vi.fn()}
      />,
    );
    expect(
      (await screen.findByText('Halftime')).closest('li'),
    ).toHaveTextContent('8A · 65 BPM · half tempo +1.6% · Same key');
  });

  it('asks for analysis when the track has neither BPM nor key', () => {
    const { library, evaluate } = libraryWith([]);
    render(
      <MixableTracksSection
        library={library}
        track={track('a', 'Source', null, null)}
        onPlay={vi.fn()}
        onQueue={vi.fn()}
      />,
    );
    expect(screen.getByText(/Analyze this track/)).toBeInTheDocument();
    expect(evaluate).not.toHaveBeenCalled();
  });

  it('says so when nothing matches', async () => {
    const { library } = libraryWith([]);
    render(
      <MixableTracksSection
        library={library}
        track={track('a', 'Source', 128, 'Am')}
        onPlay={vi.fn()}
        onQueue={vi.fn()}
      />,
    );
    expect(
      await screen.findByText(/Nothing in your library matches yet/),
    ).toBeInTheDocument();
  });
});
