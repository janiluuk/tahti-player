import { describe, expect, it } from 'vitest';

import {
  addToQueue,
  advanceQueue,
  clearQueue,
  createInitialState,
  currentList,
  currentNavId,
  formatTime,
  goToPrevious,
  HISTORY_LIMIT,
  moveList,
  moveNav,
  NAV_ITEMS,
  nowPlayingLine,
  setNowPlaying,
  shouldRestart,
  toggleFocus,
} from './state.mjs';

const ONE = { id: '1', title: 'One', kind: 'track', source: 'library' };
const TWO = { id: '2', title: 'Two', kind: 'track', source: 'search' };
const THREE = { id: '3', title: 'Three', kind: 'track', source: 'likes' };
const RADIO = {
  id: 'radio',
  title: 'Tahti Radio',
  kind: 'live',
  source: 'radio',
  url: 'https://example.com/live.m3u8',
};

describe('shell state', () => {
  it('starts on library with list focus', () => {
    const state = createInitialState();
    expect(currentNavId(state)).toBe('library');
    expect(state.focus).toBe('list');
    expect(NAV_ITEMS.map((item) => item.id)).toEqual([
      'library',
      'search',
      'likes',
      'radio',
      'queue',
      'history',
    ]);
  });

  it('starts with a saved history, so p goes back to the last session', () => {
    const state = createInitialState({ history: [TWO, ONE] });
    expect(state.history).toEqual([TWO, ONE]);
    const previous = goToPrevious(state);
    expect(previous.nowPlaying).toBe(TWO);
    expect(previous.history).toEqual([ONE]);
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
      navIndex: 4,
      queue: [{ id: 'q', title: 'Q' }],
    };
    expect(currentList(state)).toHaveLength(1);
    expect(
      currentList({ ...state, navIndex: 2, likes: [{ id: 'l' }, { id: 'm' }] }),
    ).toHaveLength(2);
  });

  it('keeps the tracks played before, newest first, without live streams', () => {
    let state = setNowPlaying(createInitialState(), ONE);
    expect(state.history).toEqual([]);
    state = setNowPlaying(state, TWO);
    state = setNowPlaying(state, TWO);
    state = setNowPlaying(state, RADIO);
    state = setNowPlaying(state, THREE);
    expect(state.history.map((item) => item.id)).toEqual(['2', '1']);
    expect(currentList({ ...state, navIndex: 5 })).toBe(state.history);
  });

  it('records the track that ends or is skipped', () => {
    let state = { ...setNowPlaying(createInitialState(), ONE), queue: [TWO] };
    state = advanceQueue(state);
    expect(state.history.map((item) => item.id)).toEqual(['1']);
    state = advanceQueue(state);
    expect(state.nowPlaying).toBeNull();
    expect(state.history.map((item) => item.id)).toEqual(['2', '1']);
  });

  it('caps the history', () => {
    let state = createInitialState();
    for (let i = 0; i < HISTORY_LIMIT + 5; i += 1) {
      state = setNowPlaying(state, { ...ONE, id: String(i) });
    }
    expect(state.history).toHaveLength(HISTORY_LIMIT);
    expect(state.history[0].id).toBe(String(HISTORY_LIMIT + 3));
  });

  it('goes back through the history and lets next return', () => {
    let state = setNowPlaying(createInitialState(), ONE);
    state = setNowPlaying(state, TWO);
    state = { ...setNowPlaying(state, THREE), queue: [ONE] };

    state = goToPrevious(state);
    expect(state.nowPlaying).toBe(TWO);
    expect(state.queue.map((item) => item.id)).toEqual(['3', '1']);
    state = goToPrevious(state);
    expect(state.nowPlaying).toBe(ONE);
    expect(state.history).toEqual([]);
    expect(goToPrevious(state).status).toBe('Nothing played before this.');

    state = advanceQueue(state);
    expect(state.nowPlaying).toBe(TWO);
    expect(state.history).toEqual([ONE]);
  });

  it('does not queue a live stream when going back from it', () => {
    let state = setNowPlaying(createInitialState(), ONE);
    state = setNowPlaying(state, RADIO, { clearQueueForLive: true });
    state = goToPrevious(state);
    expect(state.nowPlaying).toBe(ONE);
    expect(state.queue).toEqual([]);
  });

  it('restarts a track only after the first seconds', () => {
    const playing = setNowPlaying(createInitialState(), ONE);
    expect(shouldRestart({ ...playing, timePos: 2 })).toBe(false);
    expect(shouldRestart({ ...playing, timePos: 12 })).toBe(true);
    expect(
      shouldRestart({ ...setNowPlaying(playing, RADIO), timePos: 12 }),
    ).toBe(false);
    expect(shouldRestart({ ...createInitialState(), timePos: 12 })).toBe(false);
  });
});
