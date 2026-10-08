import { describe, expect, it } from 'vitest';

import {
  bitrateForExport,
  extensionForMime,
  pickRecorderMimeType,
} from './exportVisualizerClip';

describe('exportVisualizerClip helpers', () => {
  it('picks a supported mime type when MediaRecorder exists', () => {
    const original = globalThis.MediaRecorder;
    class FakeRecorder {
      static isTypeSupported(type: string) {
        return type === 'video/webm';
      }
    }
    // @ts-expect-error test stub
    globalThis.MediaRecorder = FakeRecorder;
    expect(pickRecorderMimeType()).toBe('video/webm');
    globalThis.MediaRecorder = original;
  });

  it('maps mime to extension', () => {
    expect(extensionForMime('video/mp4')).toBe('mp4');
    expect(extensionForMime('video/webm;codecs=vp9')).toBe('webm');
  });

  it('keeps bitrate under a budget for short clips', () => {
    expect(bitrateForExport(15, '720')).toBeLessThanOrEqual(4_000_000);
    expect(bitrateForExport(5, '480')).toBeLessThanOrEqual(2_500_000);
  });
});
