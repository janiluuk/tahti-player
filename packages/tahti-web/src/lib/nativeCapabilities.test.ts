import { afterEach, describe, expect, it } from 'vitest';

import { getNativeCapabilities, hasNativePlayer } from './nativeCapabilities';
import { playableFromNativeTrack } from './nativeLibrary';

describe('nativeCapabilities', () => {
  afterEach(() => {
    delete globalThis.__TAHTI_NATIVE_CAPABILITIES__;
  });

  it('reports browser fallback when no desktop bridge is present', () => {
    expect(getNativeCapabilities()).toEqual({ localLibrary: false });
    expect(hasNativePlayer()).toBe(false);
  });

  it('detects the desktop player capability signal', () => {
    globalThis.__TAHTI_NATIVE_CAPABILITIES__ = { localLibrary: true };
    expect(hasNativePlayer()).toBe(true);
  });

  it('maps a native catalog row to a local playable', () => {
    expect(
      playableFromNativeTrack(
        {
          id: 'track-1',
          title: 'Night Drive',
          artist: 'Tahti',
          album: 'Signals',
          format: 'flac',
          duration: 214,
          sizeBytes: 100,
        },
        'asset://localhost/track-1',
      ),
    ).toMatchObject({
      id: 'local:track-1',
      kind: 'sound',
      sourceProvider: 'local',
      streamUrl: 'asset://localhost/track-1',
      durationSec: 214,
    });
  });
});
