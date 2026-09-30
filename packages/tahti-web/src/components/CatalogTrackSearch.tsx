import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, Input } from '@tahti-player/ui';

import { searchCatalogTracks, type CatalogTrack } from '../api/catalog-search';

const PAGE_SIZE = 20;

export function CatalogTrackSearch({
  label = 'Search the catalog',
  excludeIds = [],
  onAdd,
}: {
  label?: string;
  excludeIds?: readonly string[];
  onAdd: (track: CatalogTrack) => Promise<boolean>;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatalogTrack[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [searched, setSearched] = useState('');

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setHasMore(false);
      setError(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      void searchCatalogTracks(q).then((result) => {
        if (cancelled) {
          return;
        }
        setLoading(false);
        setSearched(q);
        if (!result.ok) {
          setError(result.error);
          setResults([]);
          setHasMore(false);
          return;
        }
        setError(null);
        setResults(result.tracks);
        setHasMore(result.hasMore);
        setOffset(0);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const loadMore = async () => {
    const nextOffset = offset + PAGE_SIZE;
    setLoading(true);
    const result = await searchCatalogTracks(query, nextOffset);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setResults((current) => [...current, ...result.tracks]);
    setHasMore(result.hasMore);
    setOffset(nextOffset);
  };

  const add = async (track: CatalogTrack) => {
    setAddingId(track.id);
    await onAdd(track);
    setAddingId(null);
  };

  const visible = results.filter((track) => !excludeIds.includes(track.id));

  return (
    <div className="flex flex-col gap-2">
      <Input
        label={label}
        value={query}
        placeholder="Track title"
        onChange={(event) => setQuery(event.target.value)}
      />
      {error ? (
        <p className="text-foreground-secondary text-xs" role="status">
          {error}
        </p>
      ) : null}
      {query.trim().length >= 2 &&
      searched === query.trim() &&
      !error &&
      visible.length === 0 ? (
        <p className="text-foreground-secondary text-xs">
          No public tracks match “{query.trim()}”.
        </p>
      ) : null}
      {visible.length > 0 ? (
        <ul
          aria-label="Catalog results"
          className="border-border divide-border divide-y rounded-md border"
        >
          {visible.map((track) => (
            <li
              key={track.id}
              className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate">
                {track.title}
                <span className="text-foreground-secondary">
                  {' '}
                  · {track.artistName}
                </span>
              </span>
              <Button
                size="sm"
                variant="secondary"
                disabled={addingId !== null}
                aria-label={`Add ${track.title} by ${track.artistName}`}
                onClick={() => void add(track)}
              >
                <PlusIcon size={14} aria-hidden className="mr-1.5" />
                {addingId === track.id ? 'Adding…' : 'Add'}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      {hasMore ? (
        <Button
          size="sm"
          variant="text"
          disabled={loading}
          onClick={() => void loadMore()}
        >
          {loading ? 'Loading…' : 'More results'}
        </Button>
      ) : null}
    </div>
  );
}
