import { describe, expect, it } from 'vitest';

import type { StudioSound } from '../../../api/studio-types';
import { soundRowStats } from './SoundsAmbientList';

const base = {
  id: 's1',
  title: 'Set',
  status: 'READY',
  createdAt: '2026-10-01T00:00:00.000Z',
} as StudioSound;

describe('soundRowStats', () => {
  it('shows the release date and public totals', () => {
    expect(
      soundRowStats({
        ...base,
        releasedAt: '2026-10-03T00:00:00.000Z',
        likeCount: 3,
        playCount: 31,
        downloadCount: 15,
      }),
    ).toEqual({
      releaseDate: '2026-10-03T00:00:00.000Z',
      likes: 3,
      plays: 31,
      downloads: 15,
    });
  });

  it('shows nothing until the API sends totals', () => {
    expect(soundRowStats(base)).toBeUndefined();
  });
});
