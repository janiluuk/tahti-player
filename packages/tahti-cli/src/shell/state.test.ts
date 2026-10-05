import { describe, expect, it } from 'vitest';

import {
  addToQueue,
  advanceQueue,
  clearQueue,
  createInitialState,
  currentList,
  currentNavId,
  formatTime,
  moveList,
  moveNav,
  NAV_ITEMS,
  nowPlayingLine,
  setNowPlaying,
  toggleFocus,
} from './state.mjs';

describe('shell state', () => {
  it('starts on library with list focus', () => {
    const state = createInitialState();
    expect(currentNavId(state)).toBe('library');
    expect(state.focus).toBe('list');
    expect(NAV_ITEMS.map((item) => item.id)).toEqual([
      'library',
      'search',
      'radio',
      'queue',
    ]);
  });

  it('moves nav and resets list index', () => {
    let state = {
      ...createInitialState(),
      library: [{ id: 'a', title: 'A' }],
      listIndex: 0,
    };
    state = moveNav(state, 1);
    expect(currentNavId(state)).toBe('search');
    expect(state.listIndex).toBe(0);
  });

  it('clamps list movement', () => {
    let state = {
      ...createInitialState(),
      library: [
        { id: 'a', title: 'A' },
        { id: 'b', title: 'B' },
      ],
    };
    state = moveList(state, 1);
    expect(state.listIndex).toBe(1);
    state = moveList(state, 1);
    expect(state.listIndex).toBe(1);
    state = moveList(state, -5);
    expect(state.listIndex).toBe(0);
  });

  it('toggles focus between nav and list', () => {
    let state = createInitialState();
    state = toggleFocus(state);
    expect(state.focus).toBe('nav');
    state = toggleFocus(state);
    expect(state.focus).toBe('list');
  });

  it('queues tracks and refuses live items', () => {
    const track = {
      id: '1',
      title: 'Track',
      kind: 'track',
      source: 'library',
    };
    let state = addToQueue(createInitialState(), track);
    expect(state.queue).toHaveLength(1);
    state = addToQueue(state, {
      id: 'live',
      title: 'Radio',
      kind: 'live',
      source: 'radio',
    });
    expect(state.queue).toHaveLength(1);
    expect(state.status).toContain('not queued');
  });

  it('clears queue and advances after now playing', () => {
    let state = {
      ...createInitialState(),
      queue: [
        { id: '2', title: 'Two', kind: 'track', source: 'library' },
        { id: '3', title: 'Three', kind: 'track', source: 'library' },
      ],
      nowPlaying: { id: '1', title: 'One', kind: 'track', source: 'library' },
    };
    state = advanceQueue(state);
    expect(state.nowPlaying?.id).toBe('2');
    expect(state.queue).toHaveLength(1);
    state = clearQueue(state);
    expect(state.queue).toHaveLength(0);
  });

  it('clears progressive queue when starting a live stream', () => {
    const state = setNowPlaying(
      {
        ...createInitialState(),
        queue: [{ id: '1', title: 'A', kind: 'track', source: 'library' }],
      },
      {
        id: 'radio',
        title: 'Tahti Radio',
        kind: 'live',
        source: 'radio',
        url: 'https://example.com/live.m3u8',
      },
      { clearQueueForLive: true },
    );
    expect(state.queue).toHaveLength(0);
    expect(state.nowPlaying?.kind).toBe('live');
  });

  it('formats now-playing and time', () => {
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(null)).toBe('--:--');
    const line = nowPlayingLine({
      ...createInitialState(),
      nowPlaying: {
        id: '1',
        title: 'Song',
        artist: 'Artist',
        kind: 'track',
      },
      paused: false,
      timePos: 10,
      duration: 100,
    });
    expect(line).toContain('Playing');
    expect(line).toContain('Song — Artist');
    expect(line).toContain('0:10 / 1:40');
  });

  it('exposes the current list for each nav pane', () => {
    const state = {
      ...createInitialState(),
      navIndex: 3,
      queue: [{ id: 'q', title: 'Q' }],
    };
    expect(currentList(state)).toHaveLength(1);
  });
});
