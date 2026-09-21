import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_VIEW_STATE,
  flushViewState,
  loadViewState,
  resetViewStateForTests,
  rowsToRestore,
  saveViewState,
  saveViewStateDeferred,
} from './localLibraryViewState';
import { countActiveFilters, EMPTY_TRACK_FILTERS } from './nativeLibrary';

beforeEach(() => {
  resetViewStateForTests();
  window.sessionStorage.clear();
});

afterEach(() => vi.useRealTimers());

describe('deferred scroll saving', () => {
  it('keeps memory current, writes storage once per burst, and flushes on demand', () => {
    vi.useFakeTimers();
    for (let offset = 1; offset <= 50; offset += 1) {
      saveViewStateDeferred({ scrollOffset: offset * 10 });
    }
    expect(loadViewState().scrollOffset).toBe(500);
    expect(window.sessionStorage.length).toBe(0);
    vi.advanceTimersByTime(300);
    expect(window.sessionStorage.length).toBe(1);

    saveViewStateDeferred({ scrollOffset: 900 });
    resetViewStateForTests();
    expect(loadViewState().scrollOffset).toBe(500); // not written yet
    saveViewStateDeferred({ scrollOffset: 900 });
    flushViewState();
    resetViewStateForTests();
    expect(loadViewState().scrollOffset).toBe(900);
  });
});

describe('localLibraryViewState', () => {
  it('starts from defaults and remembers patches in memory and sessionStorage', () => {
    expect(loadViewState()).toEqual(DEFAULT_VIEW_STATE);
    saveViewState({ query: 'harbour', browseKind: 'albums' });
    saveViewState({ scrollOffset: 900, loadedCount: 300 });
    expect(loadViewState()).toMatchObject({
      query: 'harbour',
      browseKind: 'albums',
      scrollOffset: 900,
    });
    resetViewStateForTests();
    expect(loadViewState().query).toBe('harbour');
  });

  it('survives corrupt storage and stored filters from an older shape', () => {
    window.sessionStorage.setItem('tahti-local-library-view', '{oops');
    expect(loadViewState()).toEqual(DEFAULT_VIEW_STATE);
    resetViewStateForTests();
    window.sessionStorage.setItem(
      'tahti-local-library-view',
      JSON.stringify({ filters: { yearMin: 2000 } }),
    );
    expect(loadViewState().filters).toEqual({
      ...EMPTY_TRACK_FILTERS,
      yearMin: 2000,
    });
  });

  it('only preloads rows when there is a scroll position to return to, capped', () => {
    expect(rowsToRestore({ ...DEFAULT_VIEW_STATE, loadedCount: 500 })).toBe(0);
    expect(
      rowsToRestore({
        ...DEFAULT_VIEW_STATE,
        scrollOffset: 10,
        loadedCount: 500,
      }),
    ).toBe(500);
    expect(
      rowsToRestore({
        ...DEFAULT_VIEW_STATE,
        scrollOffset: 10,
        loadedCount: 99999,
      }),
    ).toBe(2000);
  });
});

describe('countActiveFilters', () => {
  it('counts each restriction once and ignores empty ones', () => {
    expect(countActiveFilters(EMPTY_TRACK_FILTERS)).toBe(0);
    expect(
      countActiveFilters({
        ...EMPTY_TRACK_FILTERS,
        yearMin: 2000,
        yearMax: 2010,
        formats: ['flac', 'wav'],
        availability: 'missing',
      }),
    ).toBe(3);
  });
});
