import { useNavigate } from '@tanstack/react-router';
import {
  DiscIcon,
  ListMusicIcon,
  SearchIcon,
  UserIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  Button,
  cn,
  EmptyState,
  ImageReveal,
  Input,
  Loader,
  Tooltip,
} from '@tahti-player/ui';

import { fetchSearch } from '../api/client';
import type {
  SearchArtistResult,
  SearchCollectionResult,
  SearchResponse,
  SearchTrackResult,
} from '../api/types';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { formatDuration } from '../lib/playableToTrack';

const EMPTY: SearchResponse = { tracks: [], artists: [], collections: [] };
const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

function Thumbnail({ src, seed }: { src: string | null; seed: string }) {
  return (
    <ImageReveal
      src={src ?? placeholderArtworkUrl(seed)}
      alt=""
      className="border-border size-10 shrink-0 rounded-md border"
    />
  );
}

function ResultRow({
  id,
  active,
  thumbnail,
  title,
  meta,
  onSelect,
}: {
  id: string;
  active: boolean;
  thumbnail: React.ReactNode;
  title: string;
  meta: string;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (active) {
      ref.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [active]);

  return (
    <Button
      variant="text"
      size="flexible"
      id={id}
      ref={ref}
      type="button"
      role="option"
      aria-selected={active}
      className={`hover:bg-background-secondary flex w-full min-w-0 items-center gap-2.5 rounded-md px-2 py-1.5 text-left ${
        active ? 'bg-background-secondary' : ''
      }`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
    >
      {thumbnail}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span className="text-foreground-secondary block truncate text-xs">
          {meta}
        </span>
      </span>
    </Button>
  );
}

/** Top-nav search across artists, tracks, and collections — debounced,
 * thumbnailed results grouped and labeled by type. */
type GlobalSearchProps = {
  autoFocus?: boolean;
  fullWidth?: boolean;
  onDone?: () => void;
};

export function GlobalSearch({
  autoFocus,
  fullWidth,
  onDone,
}: GlobalSearchProps = {}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      void fetchSearch(trimmed).then(({ data }) => {
        if (!cancelled) {
          setResults(data);
          setLoading(false);
        }
      });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [results, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery('');
    onDone?.();
  };

  const goToArtist = (artist: SearchArtistResult) => {
    close();
    void navigate({
      to: '/u/$username',
      params: { username: artist.username },
    });
  };

  const goToTrack = (track: SearchTrackResult) => {
    close();
    void navigate({ to: '/t/$id', params: { id: track.id } });
  };

  const goToCollection = (collection: SearchCollectionResult) => {
    close();
    void navigate({
      to: '/u/$username/c/$slug',
      params: { username: collection.ownerUsername, slug: collection.slug },
    });
  };

  const trimmed = query.trim();
  const hasQuery = trimmed.length >= MIN_QUERY_LENGTH;
  const hasResults =
    results.artists.length > 0 ||
    results.tracks.length > 0 ||
    results.collections.length > 0;

  // Flat, render-order list so arrow keys can rove across the three
  // grouped sections as one sequence, matching how a screen reader's
  // combobox/listbox pattern is expected to behave.
  const flatOptions: { id: string; select: () => void }[] = [
    ...results.artists.map((a) => ({
      id: `search-option-artist-${a.username}`,
      select: () => goToArtist(a),
    })),
    ...results.tracks.map((t) => ({
      id: `search-option-track-${t.id}`,
      select: () => goToTrack(t),
    })),
    ...results.collections.map((c) => ({
      id: `search-option-collection-${c.slug}`,
      select: () => goToCollection(c),
    })),
  ];

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || flatOptions.length === 0) {
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % flatOptions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? flatOptions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      flatOptions[Math.max(activeIndex, 0)]?.select();
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative w-full min-w-0',
        !fullWidth && 'max-w-xs sm:max-w-sm',
      )}
    >
      <div className="relative">
        <Input
          type="search"
          size="sm"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search artists, tracks, playlists…"
          aria-label="Search artists, tracks, and playlists"
          role="combobox"
          aria-expanded={open && hasQuery}
          aria-controls="global-search-listbox"
          aria-activedescendant={
            activeIndex >= 0 ? flatOptions[activeIndex]?.id : undefined
          }
          autoComplete="off"
          autoFocus={autoFocus}
          className={cn(
            '[&::-webkit-search-cancel-button]:appearance-none',
            query && 'pr-9',
          )}
          startAddon={
            <SearchIcon size={14} aria-hidden className="opacity-70" />
          }
        />
        {query ? (
          <Tooltip content="Clear search" side="top">
            <Button
              type="button"
              size="icon-sm"
              variant="text"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute top-1 right-1"
            >
              <XIcon size={14} aria-hidden />
            </Button>
          </Tooltip>
        ) : null}
      </div>

      {open && hasQuery && (
        <div
          id="global-search-listbox"
          role="listbox"
          aria-label="Search results"
          className="border-border bg-background shadow-shadow absolute top-full right-0 left-0 z-40 mt-1.5 max-h-[70vh] overflow-y-auto rounded-lg border p-1.5"
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2 py-3">
              <Loader size="sm" />
              <p className="text-foreground-secondary text-sm">Searching…</p>
            </div>
          ) : !hasResults ? (
            <EmptyState size="sm" title={`No results for “${trimmed}”.`} />
          ) : (
            <div className="flex flex-col gap-2">
              {results.artists.length > 0 && (
                <div>
                  <p className="text-foreground-secondary flex items-center gap-1.5 px-2 py-1 text-xs font-semibold uppercase">
                    <UserIcon size={12} aria-hidden /> Artists
                  </p>
                  {results.artists.map((artist, i) => (
                    <ResultRow
                      key={artist.username}
                      id={`search-option-artist-${artist.username}`}
                      active={activeIndex === i}
                      thumbnail={
                        <Thumbnail
                          src={artist.avatarUrl}
                          seed={artist.username}
                        />
                      }
                      title={artist.displayName}
                      meta={`@${artist.username}`}
                      onSelect={() => goToArtist(artist)}
                    />
                  ))}
                </div>
              )}
              {results.tracks.length > 0 && (
                <div>
                  <p className="text-foreground-secondary flex items-center gap-1.5 px-2 py-1 text-xs font-semibold uppercase">
                    <DiscIcon size={12} aria-hidden /> Tracks
                  </p>
                  {results.tracks.map((track, i) => (
                    <ResultRow
                      key={track.id}
                      id={`search-option-track-${track.id}`}
                      active={activeIndex === results.artists.length + i}
                      thumbnail={
                        <Thumbnail src={track.coverUrl} seed={track.id} />
                      }
                      title={track.title}
                      meta={`by ${track.artistName}${
                        track.durationSec
                          ? ` · ${formatDuration(track.durationSec)}`
                          : ''
                      }`}
                      onSelect={() => goToTrack(track)}
                    />
                  ))}
                </div>
              )}
              {results.collections.length > 0 && (
                <div>
                  <p className="text-foreground-secondary flex items-center gap-1.5 px-2 py-1 text-xs font-semibold uppercase">
                    <ListMusicIcon size={12} aria-hidden /> Playlists
                  </p>
                  {results.collections.map((collection, i) => (
                    <ResultRow
                      key={collection.slug}
                      id={`search-option-collection-${collection.slug}`}
                      active={
                        activeIndex ===
                        results.artists.length + results.tracks.length + i
                      }
                      thumbnail={
                        <Thumbnail
                          src={collection.coverUrl}
                          seed={collection.slug}
                        />
                      }
                      title={collection.name}
                      meta={`by ${collection.ownerDisplayName}`}
                      onSelect={() => goToCollection(collection)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
