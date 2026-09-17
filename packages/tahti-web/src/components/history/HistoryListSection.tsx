import { HistoryIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  EmptyState,
  HistoryDayGroup,
  HistoryRow,
  Pagination,
  Select,
} from '@tahti-player/ui';

import type { TahtiPlayable } from '../../api/types';
import { resolveLocalPlayableForReplay } from '../../lib/nativeLibrary';
import { useLibraryStore, type HistoryEntry } from '../../stores/libraryStore';
import { usePlayerStore } from '../../stores/playerStore';

async function resolvePlayableForReplay(
  playable: TahtiPlayable,
): Promise<TahtiPlayable | null> {
  try {
    const resolved = await resolveLocalPlayableForReplay(playable);
    if (!resolved) {
      toast.error('Re-import this file from your library to play it again.');
    }
    return resolved;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Track unavailable.');
    return null;
  }
}

const PAGE_SIZES = [10, 25, 50];

function dayKey(playedAt: string): string {
  return playedAt.slice(0, 10);
}

function dayMarker(key: string): string {
  const today = dayKey(new Date().toISOString());
  const yesterday = dayKey(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  );
  if (key === today) {
    return 'Today';
  }
  if (key === yesterday) {
    return 'Yesterday';
  }
  return new Date(`${key}T00:00:00`).toLocaleDateString(undefined, {
    dateStyle: 'full',
  });
}

function groupByDay(
  entries: HistoryEntry[],
): { key: string; entries: HistoryEntry[] }[] {
  const byKey = new Map<string, HistoryEntry[]>();
  for (const entry of entries) {
    const key = dayKey(entry.playedAt);
    const group = byKey.get(key);
    if (group) {
      group.push(entry);
    } else {
      byKey.set(key, [entry]);
    }
  }
  return [...byKey.entries()].map(([key, dayEntries]) => ({
    key,
    entries: dayEntries,
  }));
}

export function HistoryListSection({ history }: { history: HistoryEntry[] }) {
  const toggleFavoriteTrack = useLibraryStore((s) => s.toggleFavoriteTrack);
  const isFavoriteTrack = useLibraryStore((s) => s.isFavoriteTrack);
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]!);

  const totalPages = Math.max(1, Math.ceil(history.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageEntries = useMemo(
    () => history.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [history, currentPage, pageSize],
  );
  const groups = useMemo(() => groupByDay(pageEntries), [pageEntries]);

  if (history.length === 0) {
    return (
      <EmptyState
        data-testid="history-empty-state"
        icon={<HistoryIcon size={48} />}
        title="Nothing played yet"
        description="Tracks you play show up here, most recent first."
        className="flex-1"
      />
    );
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-6 pb-6">
      {groups.map((group) => (
        <HistoryDayGroup key={group.key} marker={dayMarker(group.key)}>
          {group.entries.map((entry) => {
            const p = entry.playable;
            return (
              <HistoryRow
                key={`${p.id}-${entry.playedAt}`}
                title={p.title}
                artist={p.artist}
                time={new Date(entry.playedAt).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
                artworkUrl={p.coverUrl}
                isFavorite={isFavoriteTrack(p.id)}
                onToggleFavorite={() => toggleFavoriteTrack(p)}
                onAddToQueue={() => {
                  void resolvePlayableForReplay(p).then(
                    (resolved) => resolved && enqueue(resolved),
                  );
                }}
                onPlayNow={() => {
                  void resolvePlayableForReplay(p).then(
                    (resolved) => resolved && play(resolved),
                  );
                }}
                labels={{
                  favorite: 'Add to favorites',
                  unfavorite: 'Remove from favorites',
                  addToQueue: 'Add to queue',
                }}
              />
            );
          })}
        </HistoryDayGroup>
      ))}

      {totalPages > 1 && (
        <footer
          data-testid="history-pagination"
          className="flex w-full flex-col gap-2 pb-6"
        >
          <div className="flex justify-end pr-1">
            <div data-testid="history-page-size" className="w-24">
              <Select
                options={PAGE_SIZES.map((size) => ({
                  id: String(size),
                  label: String(size),
                }))}
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
              />
            </div>
          </div>
          <div className="flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              labels={{
                navigation: 'Pagination',
                previous: 'Previous page',
                next: 'Next page',
                page: (n) => `Page ${n}`,
              }}
            />
          </div>
        </footer>
      )}
    </div>
  );
}
