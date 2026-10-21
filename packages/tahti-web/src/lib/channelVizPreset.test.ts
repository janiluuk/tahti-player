import { afterEach, describe, expect, it } from 'vitest';

import {
  channelVizStorageKey,
  loadChannelVizMode,
  saveChannelVizMode,
} from './channelVizPreset';

describe('channelVizPreset', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('persists and reloads a mode per channel key', () => {
    saveChannelVizMode('artist', 'quantum');
    expect(localStorage.getItem(channelVizStorageKey('artist'))).toBe(
      'quantum',
    );
    expect(loadChannelVizMode('artist')).toBe('quantum');
    expect(loadChannelVizMode('other', 'spectrum')).toBe('spectrum');
  });

  it('ignores unknown stored values', () => {
    localStorage.setItem(channelVizStorageKey('x'), 'not-a-mode');
    expect(loadChannelVizMode('x', 'radial')).toBe('radial');
  });
});
