import { describe, expect, it } from 'vitest';

import { isAudioEditorPath } from './audioEditorPath';

describe('isAudioEditorPath', () => {
  it('matches the sound editor and the older editor urls', () => {
    expect(isAudioEditorPath('/studio/sounds/track-1/editor')).toBe(true);
    expect(isAudioEditorPath('/studio/archive/arch-1/editor')).toBe(true);
    expect(isAudioEditorPath('/studio/editor/proj-1')).toBe(true);
    expect(isAudioEditorPath('/studio/sounds/track-1')).toBe(false);
    expect(isAudioEditorPath('/studio/sounds/track-1/editor/extra')).toBe(
      false,
    );
    expect(isAudioEditorPath('/studio/mastering/arch-1')).toBe(false);
  });
});
