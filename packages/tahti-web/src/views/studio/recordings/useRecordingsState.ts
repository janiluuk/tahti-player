import { useEffect, useMemo, useState } from 'react';

import {
  fetchRecentBroadcasts,
  type RecentBroadcast,
} from '../../../api/broadcast';
import {
  fetchShowRefBySoundItemId,
  type ShowRefBySoundItemId,
} from '../../../api/shows';
import { groupByShow, isPublished, sortShows, type SortKey } from './helpers';

/** Loading, filtering, sorting and grouping for the Recordings list. */
export function useRecordingsState() {
  const [recordings, setRecordings] = useState<RecentBroadcast[]>([]);
  const [showRefBySoundItemId, setShowRefBySoundItemId] =
    useState<ShowRefBySoundItemId>(new Map());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [editingSoundId, setEditingSoundId] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    void Promise.all([
      fetchRecentBroadcasts(500),
      fetchShowRefBySoundItemId(),
    ]).then(([broadcastsRes, showRefRes]) => {
      setRecordings(broadcastsRes.data);
      setShowRefBySoundItemId(showRefRes.data);
      setLoading(false);
    });
  };

  useEffect(reload, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return recordings;
    }
    return recordings.filter((show) =>
      [show.title, show.soundTitle, show.source]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [query, recordings]);

  const drafts = useMemo(
    () =>
      sortShows(
        filtered.filter((show) => !isPublished(show)),
        sort,
      ),
    [filtered, sort],
  );

  const groups = useMemo(() => {
    const published = filtered.filter(isPublished);
    return groupByShow(published, showRefBySoundItemId).map((group) => ({
      ...group,
      items: sortShows(group.items, sort),
    }));
  }, [filtered, sort, showRefBySoundItemId]);

  return {
    recordings,
    loading,
    query,
    setQuery,
    sort,
    setSort,
    editingSoundId,
    setEditingSoundId,
    reload,
    filtered,
    drafts,
    groups,
  };
}

export type RecordingsState = ReturnType<typeof useRecordingsState>;
