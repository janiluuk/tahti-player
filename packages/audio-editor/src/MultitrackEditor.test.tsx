import { describe, expect, it } from 'vitest';

import { RACK_EFFECTS } from '@tahti-player/audio-rack';

import { useEditorStore } from './state/editorStore';

describe('audio-editor package surface', () => {
  it('starts with default tracks and exposes loadProject', () => {
    const st = useEditorStore.getState();
    expect(typeof st.loadProject).toBe('function');
    expect(typeof st.addTrack).toBe('function');
    expect(typeof st.addMasterEffect).toBe('function');
  });

  it('shares the rack catalog with audio-rack', () => {
    expect(RACK_EFFECTS.length).toBeGreaterThanOrEqual(19);
  });
});
