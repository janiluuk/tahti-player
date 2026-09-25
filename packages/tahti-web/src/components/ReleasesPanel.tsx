import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ButtonLink, Input, MediaArtwork } from '@tahti-player/ui';

import type { PublicProfileRelease } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';
import { MediaIconActions, playQueueFavoriteActions } from './MediaIconActions';
import { PageEmpty } from './PageStates';
import {
  releasePlayables,
  ReleaseTracklistDialog,
} from './ReleaseTracklistDialog';

type SortKey = 'title' | 'type' | 'date';
type SortDir = 'asc' | 'desc';

function formatReleaseDate(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function SortHeader({
  label,
  sortKey,
  active,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  active: boolean;
  dir: SortDir;
  onClick: (key: SortKey) => void;
}) {
  return (
    <button
      type="button"
      className="text-foreground-secondary hover:text-foreground flex items-center gap-1 text-left text-xs font-semibold tracking-wide uppercase"
      onClick={() => onClick(sortKey)}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label}
      {active &&
        (dir === 'asc' ? (
          <ArrowUpIcon size={12} aria-hidden />
        ) : (
          <ArrowDownIcon size={12} aria-hidden />
        ))}
    </button>
  );
}

/** Searchable, sortable, zebra-striped release table with tracklist
 * drill-down — the "Releases" half of MyDiscographyView, pulled out so
 * it can also stand alone as its own Library tab. */
export function ReleasesPanel({
  releases,
  artist,
  slug,
}: {
  releases: PublicProfileRelease[];
  artist: string;
  slug?: string;
}) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [tracklistRelease, setTracklistRelease] =
    useState<PublicProfileRelease | null>(null);

  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const queue = usePlayerStore((s) => s.queue);
  const currentId = usePlayerStore((s) => s.currentId);
  const playerStatus = usePlayerStore((s) => s.status);
  const setPlayerStatus = usePlayerStore((s) => s.setStatus);

  const setSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'date' ? 'desc' : 'asc');
    }
  };

  const sortedReleases = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? releases.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            (r.type ?? '').toLowerCase().includes(q),
        )
      : releases;
    const sign = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'title':
          return sign * a.title.localeCompare(b.title);
        case 'type':
          return sign * (a.type ?? '').localeCompare(b.type ?? '');
        case 'date':
        default:
          return (
            sign * (a.releaseDate ?? '').localeCompare(b.releaseDate ?? '')
          );
      }
    });
  }, [releases, query, sortKey, sortDir]);

  if (releases.length === 0) {
    return (
      <PageEmpty
        title="No releases yet"
        description="Publish a release in Studio to see it here."
        action={
          <ButtonLink to="/studio/releases" size="sm" variant="secondary">
            Studio → Releases
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search releases…"
        className="max-w-xs"
        aria-label="Search releases"
      />

      {sortedReleases.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          No releases match “{query}”.
        </p>
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border bg-background-secondary border-b">
                <th className="w-12 px-3 py-2" />
                <th className="px-3 py-2 text-left">
                  <SortHeader
                    label="Title"
                    sortKey="title"
                    active={sortKey === 'title'}
                    dir={sortDir}
                    onClick={setSort}
                  />
                </th>
                <th className="hidden px-3 py-2 text-left sm:table-cell">
                  <SortHeader
                    label="Type"
                    sortKey="type"
                    active={sortKey === 'type'}
                    dir={sortDir}
                    onClick={setSort}
                  />
                </th>
                <th className="hidden px-3 py-2 text-left md:table-cell">
                  <SortHeader
                    label="Released"
                    sortKey="date"
                    active={sortKey === 'date'}
                    dir={sortDir}
                    onClick={setSort}
                  />
                </th>
                <th className="w-24 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {sortedReleases.map((rel, i) => {
                const playables = releasePlayables(rel, artist, slug);
                return (
                  <tr
                    key={rel.id}
                    className={`border-border border-b last:border-b-0 ${
                      i % 2 === 1 ? 'bg-background-secondary/40' : ''
                    }`}
                  >
                    <td className="px-3 py-2">
                      <MediaArtwork
                        size="sm"
                        src={rel.artworkUrl}
                        alt=""
                        className="bg-surface-secondary rounded-md text-[10px] font-bold"
                        placeholder={rel.title.slice(0, 2).toUpperCase()}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="truncate text-left font-medium hover:underline"
                        onClick={() => setTracklistRelease(rel)}
                      >
                        {rel.title}
                      </button>
                    </td>
                    <td className="text-foreground-secondary hidden px-3 py-2 sm:table-cell">
                      {rel.type ?? 'Release'}
                    </td>
                    <td className="text-foreground-secondary hidden px-3 py-2 md:table-cell">
                      {formatReleaseDate(rel.releaseDate)}
                    </td>
                    <td className="px-3 py-2">
                      <MediaIconActions
                        actions={playQueueFavoriteActions({
                          onPlay: () => {
                            const [head, ...rest] = playables;
                            if (head) {
                              play(head, { enqueueRest: rest });
                            }
                          },
                          onTogglePause: () =>
                            setPlayerStatus(
                              playerStatus === 'playing' ||
                                playerStatus === 'loading'
                                ? 'paused'
                                : 'playing',
                            ),
                          isPlaying:
                            playables.some((p) => p.id === currentId) &&
                            (playerStatus === 'playing' ||
                              playerStatus === 'loading'),
                          onQueue: () => {
                            for (const p of playables) {
                              enqueue(p);
                            }
                          },
                          playDisabled: playables.length === 0,
                          queueDisabled: playables.length === 0,
                          playLabel: `Play ${rel.title}`,
                          queueLabel: `Queue ${rel.title}`,
                          queued:
                            playables.length > 0 &&
                            playables.every((playable) =>
                              queue.some(
                                (queueItem) => queueItem.id === playable.id,
                              ),
                            ),
                        })}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ReleaseTracklistDialog
        isOpen={Boolean(tracklistRelease)}
        onClose={() => setTracklistRelease(null)}
        release={tracklistRelease}
        artistName={artist}
        channelSlug={slug}
      />
    </div>
  );
}
