import { describe, expect, it } from 'vitest';

import type { StudioSound } from '../../api/studio-types';
import {
  filterVisualizerEditorTracks,
  formatTrackDuration,
  isVisualizerEditorTrack,
} from './visualizerEditorTracks';

function sound(
  partial: Partial<StudioSound> & Pick<StudioSound, 'id' | 'title'>,
): StudioSound {
  return {
    status: 'READY',
    ...partial,
  };
}

describe('visualizerEditorTracks', () => {
  it('accepts READY non-embed sounds', () => {
    expect(isVisualizerEditorTrack(sound({ id: '1', title: 'A' }))).toBe(true);
  });

  it('rejects processing and embed-only sounds', () => {
    expect(
      isVisualizerEditorTrack(
        sound({ id: '1', title: 'A', status: 'PROCESSING' }),
      ),
    ).toBe(false);
    expect(
      isVisualizerEditorTrack(
        sound({ id: '1', title: 'A', embedProvider: 'HEARTHIS' }),
      ),
    ).toBe(false);
  });

  it('filters the library list', () => {
    const tracks = filterVisualizerEditorTracks([
      sound({ id: '1', title: 'Ready' }),
      sound({ id: '2', title: 'Busy', status: 'PROCESSING' }),
      sound({ id: '3', title: 'Embed', embedProvider: 'SPOTIFY' }),
    ]);
    expect(tracks.map((track) => track.id)).toEqual(['1']);
  });

  it('formats duration', () => {
    expect(formatTrackDuration(125)).toBe('2:05');
    expect(formatTrackDuration(null)).toBe('');
  });
});
