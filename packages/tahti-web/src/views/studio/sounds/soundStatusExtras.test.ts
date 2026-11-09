import { describe, expect, it } from 'vitest';

import type { TFunction } from '@tahti-player/i18n';

import type { StudioSound } from '../../../api/studio-types';
import { soundStatusExtras } from './soundStatusExtras';

const t = ((key: string, options?: Record<string, unknown>) => {
  switch (key) {
    case 'library.soundPinned':
      return ', pinned';
    case 'library.soundPrivate':
      return ', private';
    case 'library.soundDownloadsOff':
      return ', downloads off';
    case 'library.soundVia':
      return `, via ${String(options?.provider ?? '')}`;
    case 'library.soundDurationMin':
      return `, ${String(options?.minutes ?? '')} min`;
    case 'library.soundDurationHours':
      return `, ${String(options?.hours ?? '')} h ${String(options?.minutes ?? '')} min`;
    default:
      return key;
  }
}) as TFunction<'web'>;

function sound(overrides: Partial<StudioSound> = {}): StudioSound {
  return {
    id: 'sound-1',
    title: 'Night Drive',
    status: 'READY',
    createdAt: '2026-11-01T12:00:00.000Z',
    isPublic: true,
    downloadsEnabled: true,
    ...overrides,
  } as StudioSound;
}

describe('soundStatusExtras', () => {
  it('notes pinned, private, downloads off, duration and provider', () => {
    expect(
      soundStatusExtras(
        sound({
          pinnedAt: '2026-11-02T00:00:00.000Z',
          isPublic: false,
          downloadsEnabled: false,
          durationSec: 185,
          genre: 'Ambient',
          embedProvider: 'SPOTIFY',
          embedUri: 'track/abc',
        }),
        t,
      ),
    ).toBe(', pinned, 3 min, Ambient, private, downloads off, via Spotify');
  });

  it('writes an hour-long track in hours and minutes, not "62 min"', () => {
    expect(soundStatusExtras(sound({ durationSec: 3720 }), t)).toBe(
      ', 1 h 2 min',
    );
  });

  it('returns empty when there are no extras', () => {
    expect(soundStatusExtras(sound(), t)).toBe('');
  });
});
