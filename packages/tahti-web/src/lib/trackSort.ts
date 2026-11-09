import { useEffect, useState } from 'react';

import type { TFunction } from '@tahti-player/i18n';

import type { TahtiPlayable } from '../api/types';
import { webT } from './webT';

export type TrackSort =
  'default' | 'title' | 'artist' | 'shortest' | 'longest' | 'newest';

export function trackSortOptions(
  t: TFunction<'web'>,
): { id: TrackSort; label: string }[] {
  return [
    { id: 'default', label: t('trackSort.defaultOrder') },
    { id: 'title', label: t('trackSort.titleAZ') },
    { id: 'artist', label: t('trackSort.artistAZ') },
    { id: 'newest', label: t('trackSort.newestRelease') },
    { id: 'shortest', label: t('trackSort.shortestFirst') },
    { id: 'longest', label: t('trackSort.longestFirst') },
  ];
}

const STORAGE_KEY = 'tahti.ambientTrackList.sort';

const isTrackSort = (value: unknown): value is TrackSort =>
  trackSortOptions(webT()).some((option) => option.id === value);

const byText = (a: string, b: string) =>
  a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });

/** A sorted copy; tracks missing the sorted field keep their order at the
 * end. `default` keeps the caller's order. */
export function sortTracks(
  items: TahtiPlayable[],
  sort: TrackSort,
): TahtiPlayable[] {
  if (sort === 'default') {
    return items;
  }
  const indexed = items.map((item, index) => ({ item, index }));
  const compare = (
    a: { item: TahtiPlayable; index: number },
    b: { item: TahtiPlayable; index: number },
  ): number => {
    if (sort === 'title') {
      return byText(a.item.title, b.item.title);
    }
    if (sort === 'artist') {
      return byText(a.item.artist, b.item.artist);
    }
    if (sort === 'newest') {
      const ad = a.item.releaseDate ? Date.parse(a.item.releaseDate) : NaN;
      const bd = b.item.releaseDate ? Date.parse(b.item.releaseDate) : NaN;
      if (Number.isNaN(ad) || Number.isNaN(bd)) {
        return Number.isNaN(ad) ? (Number.isNaN(bd) ? 0 : 1) : -1;
      }
      return bd - ad;
    }
    const ad = a.item.durationSec;
    const bd = b.item.durationSec;
    if (ad == null || bd == null) {
      return ad == null ? (bd == null ? 0 : 1) : -1;
    }
    return sort === 'shortest' ? ad - bd : bd - ad;
  };
  return indexed
    .sort((a, b) => compare(a, b) || a.index - b.index)
    .map(({ item }) => item);
}

function readStoredSort(): TrackSort {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return isTrackSort(raw) ? raw : 'default';
  } catch {
    return 'default';
  }
}

/** The viewer's track-list sort, remembered in this browser. */
export function useTrackSort(): [TrackSort, (sort: TrackSort) => void] {
  const [sort, setSort] = useState<TrackSort>(readStoredSort);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, sort);
    } catch {
      /* private mode */
    }
  }, [sort]);
  return [sort, setSort];
}
