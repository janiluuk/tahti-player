import { ChevronDownIcon, SlidersHorizontalIcon } from 'lucide-react';
import { useMemo, useState, type FC } from 'react';

import { Button, FilterChips, Input } from '@tahti-player/ui';

import {
  isDirectoryArtistActive,
  type ChannelDirectoryItem,
} from '../api/types';
import { DirectoryArtistCardGrid } from './DirectoryArtistCardGrid';
import { PageEmpty, PageLoading } from './PageStates';

const ARTIST_TYPE_OPTIONS = [
  { id: 'dj', label: 'DJ' },
  { id: 'producer', label: 'Producer' },
  { id: 'band', label: 'Band' },
  { id: 'radio-host', label: 'Radio host' },
] as const;

type DirectoryArtistsBrowserProps = {
  artists: ChannelDirectoryItem[];
  loading?: boolean;
  liveIndicator?: 'text' | 'badge';
};

export const DirectoryArtistsBrowser: FC<DirectoryArtistsBrowserProps> = ({
  artists,
  loading = false,
  liveIndicator = 'badge',
}) => {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('all');
  const [artistType, setArtistType] = useState('all');
  const [activeOnly, setActiveOnly] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const genres = useMemo(() => {
    const counts = new Map<string, number>();
    for (const channel of artists) {
      for (const genreName of channel.genres) {
        const key = genreName.trim();
        if (!key) {
          continue;
        }
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort(
        (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
      )
      .map(([name, count]) => ({ name, count }));
  }, [artists]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return artists
      .filter((channel) => {
        if (activeOnly && !isDirectoryArtistActive(channel)) {
          return false;
        }
        if (
          genre !== 'all' &&
          !channel.genres.some(
            (channelGenre) =>
              channelGenre.toLowerCase() === genre.toLowerCase(),
          )
        ) {
          return false;
        }
        if (artistType === 'radio-host' && !channel.hasActiveShows) {
          return false;
        }
        if (
          artistType !== 'all' &&
          artistType !== 'radio-host' &&
          !(channel.artistRoles ?? []).includes(artistType)
        ) {
          return false;
        }
        if (!normalizedQuery) {
          return true;
        }
        return (
          channel.displayName.toLowerCase().includes(normalizedQuery) ||
          channel.username.toLowerCase().includes(normalizedQuery) ||
          channel.genres.some((channelGenre) =>
            channelGenre.toLowerCase().includes(normalizedQuery),
          )
        );
      })
      .sort((left, right) => {
        const leftActive = isDirectoryArtistActive(left);
        const rightActive = isDirectoryArtistActive(right);
        if (leftActive !== rightActive) {
          return leftActive ? -1 : 1;
        }
        return left.displayName.localeCompare(right.displayName);
      });
  }, [artists, query, genre, artistType, activeOnly]);

  const chipItems = useMemo(
    () => [
      { id: 'all', label: `All (${artists.length})` },
      ...genres.map((genreEntry) => ({
        id: genreEntry.name,
        label: `${genreEntry.name} (${genreEntry.count})`,
      })),
    ],
    [genres, artists.length],
  );

  const artistTypeChipItems = useMemo(
    () => [
      { id: 'all', label: 'All types' },
      ...ARTIST_TYPE_OPTIONS.map((option) => ({
        id: option.id,
        label: `${option.label} (${
          option.id === 'radio-host'
            ? artists.filter((channel) => channel.hasActiveShows).length
            : artists.filter((channel) =>
                (channel.artistRoles ?? []).includes(option.id),
              ).length
        })`,
      })),
    ],
    [artists],
  );

  const activeFilterCount =
    (genre !== 'all' ? 1 : 0) + (artistType !== 'all' ? 1 : 0);

  if (loading) {
    return (
      <section className="flex flex-col gap-4" aria-label="Browse artists">
        <PageLoading label="Loading artists…" />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4" aria-label="Browse artists">
      <div className="border-border bg-background-secondary/40 flex flex-col gap-3 rounded-xl border p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            label="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Artist name, username, genre…"
            className="min-w-48 flex-1"
          />
          <Button
            variant="text"
            size="flexible"
            type="button"
            aria-pressed={activeOnly}
            onClick={() => setActiveOnly((previous) => !previous)}
            className={`shrink-0 justify-center rounded-full border px-3 py-1 text-sm font-medium ${
              activeOnly
                ? 'bg-foreground text-background border-foreground hover:bg-foreground'
                : 'border-border text-foreground hover:bg-foreground/10 bg-transparent'
            }`}
          >
            Active now ({artists.filter(isDirectoryArtistActive).length})
          </Button>
          <Button
            variant="text"
            size="flexible"
            type="button"
            aria-expanded={filtersExpanded}
            onClick={() => setFiltersExpanded((previous) => !previous)}
            className="border-border text-foreground-secondary hover:text-foreground shrink-0 gap-1.5 rounded-full border px-3 py-1 text-sm font-medium hover:bg-transparent"
          >
            <SlidersHorizontalIcon size={14} aria-hidden />
            Filters
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            <ChevronDownIcon
              size={14}
              aria-hidden
              className={`transition-transform ${filtersExpanded ? 'rotate-180' : ''}`}
            />
          </Button>
          {genres.length > 0 ? (
            <FilterChips
              items={chipItems}
              selected={genre}
              onChange={setGenre}
            />
          ) : null}
        </div>

        {filtersExpanded ? (
          <div className="border-border flex flex-col gap-3 border-t pt-3">
            <div>
              <p className="text-foreground-secondary mb-1.5 text-xs font-semibold tracking-wide uppercase">
                Artist type
              </p>
              <FilterChips
                items={artistTypeChipItems}
                selected={artistType}
                onChange={setArtistType}
              />
            </div>
          </div>
        ) : null}

        <p className="text-foreground-secondary text-xs">
          Showing {filtered.length} of {artists.length} artists
        </p>
      </div>

      {filtered.length === 0 ? (
        <PageEmpty
          title="No artists match"
          description={`${query ? `“${query}”` : 'Try another filter'}${genre !== 'all' ? ` in ${genre}` : ''}.`}
        />
      ) : (
        <DirectoryArtistCardGrid
          artists={filtered}
          liveIndicator={liveIndicator}
        />
      )}
    </section>
  );
};
