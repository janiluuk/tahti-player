import { describe, expect, it } from 'vitest';

import type { EditorTimeline } from '../api/studio-types';
import {
  clampTimelineDuration,
  moveTimelineClip,
  normalizeTimeline,
  reorderTimelineTracks,
  toggleTimelineTrack,
} from './MultitrackTimeline';

const source = {
  title: 'Demo',
  url: 'demo.mp3',
  durationSec: 90,
  sourceKey: 'archive-1',
};
const timeline: EditorTimeline = {
  version: 1,
  durationSec: 120,
  tracks: [
    {
      id: 'a',
      name: 'A',
      color: '#fff',
      gainDb: 0,
      muted: false,
      solo: false,
      clips: [
        {
          id: 'clip',
          sourceSoundId: 'archive-1',
          startSec: 5,
          sourceOffsetSec: 0,
          durationSec: 30,
        },
      ],
    },
    {
      id: 'b',
      name: 'B',
      color: '#000',
      gainDb: 0,
      muted: false,
      solo: false,
      clips: [],
    },
  ],
};

describe('multitrack timeline model', () => {
  it('seeds an archive source and clamps clip movement', () => {
    expect(
      normalizeTimeline({ tracks: [] }, source).tracks[0]?.clips[0]
        ?.durationSec,
    ).toBe(90);
    expect(
      moveTimelineClip(timeline, 'a', 'clip', 200).tracks[0]?.clips[0]
        ?.startSec,
    ).toBe(90);
    expect(clampTimelineDuration(200, 90)).toBe(90);
  });
  it('reorders tracks and toggles their mix state', () => {
    expect(reorderTimelineTracks(timeline, 'b', 'up').tracks[0]?.id).toBe('b');
    const changed = toggleTimelineTrack(timeline, 'a', 'mute');
    expect(changed.tracks[0]?.muted).toBe(true);
    expect(toggleTimelineTrack(changed, 'a', 'solo').tracks[0]?.solo).toBe(
      true,
    );
  });
});
