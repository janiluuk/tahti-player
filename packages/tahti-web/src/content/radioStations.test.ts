import { describe, expect, it } from 'vitest';

import { playableToTrack } from '../lib/playableToTrack';
import { playableFromQueueItem } from '../stores/playerStore';
import {
  isInternetRadioPlayableId,
  radioStation,
  radioStationIdForPlayable,
  radioStationPlayable,
} from './radioStations';

describe('radioStationIdForPlayable', () => {
  it('reads the station id from a catalog playable', () => {
    expect(
      radioStationIdForPlayable({
        id: 'radio-widget:radio-helsinki',
        title: 'Radio Helsinki',
        artist: 'Finnish · Talk / Variety',
      }),
    ).toBe('radio-helsinki');
  });

  it('matches a preset to its catalog station by name', () => {
    expect(
      radioStationIdForPlayable({
        id: 'radio-preset:abc123',
        title: 'Some Song - Some Band',
        artist: 'Radio Helsinki',
      }),
    ).toBe('radio-helsinki');
    expect(
      radioStationIdForPlayable({
        id: 'radio-preset:abc123',
        title: 'Radio Helsinki',
        artist: 'Radio Helsinki',
      }),
    ).toBe('radio-helsinki');
  });

  it('has no station for an unknown preset, a Tahti channel or a track', () => {
    for (const playable of [
      { id: 'radio-preset:x', title: 'Unknown FM', artist: 'Unknown FM' },
      { id: 'radio-widget:not-a-station', title: 'X', artist: 'Y' },
      { id: 'radio:tahti-radio', title: 'Tahti Radio', artist: 'Tahti' },
      { id: 'sound:s1', title: 'Radio Helsinki', artist: 'Radio Helsinki' },
    ]) {
      expect(radioStationIdForPlayable(playable)).toBeUndefined();
    }
  });
});

describe('a radio station restored from the queue', () => {
  it('stays an internet radio stream instead of becoming an artist channel', () => {
    const station = radioStation('radio-helsinki')!;
    const playable = radioStationPlayable(station);
    expect(isInternetRadioPlayableId(playable.id)).toBe(true);

    const restored = playableFromQueueItem({
      id: playable.id,
      track: playableToTrack(playable),
      status: 'idle',
      addedAtIso: '2026-10-04T00:00:00.000Z',
    });
    expect(restored?.kind).toBe('radio');
    expect(restored?.channelSlug).toBeUndefined();
    expect(restored && radioStationIdForPlayable(restored)).toBe(
      'radio-helsinki',
    );
  });

  it('keeps the channel slug of a Tahti live channel', () => {
    const restored = playableFromQueueItem({
      id: 'live:northern-lights',
      track: playableToTrack({
        id: 'live:northern-lights',
        kind: 'live',
        title: 'Live set',
        artist: 'Northern Lights',
        streamUrl: 'https://example.test/live.m3u8',
        protocol: 'hls',
      }),
      status: 'idle',
      addedAtIso: '2026-10-04T00:00:00.000Z',
    });
    expect(restored?.kind).toBe('live');
    expect(restored?.channelSlug).toBe('northern-lights');
  });
});
