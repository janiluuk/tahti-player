import { FilterIcon, PlayIcon, PlusIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { i18n, toBcp47, useTranslation } from '@tahti-player/i18n';
import {
  Button,
  HistoryDayGroup,
  HistoryRow,
  Input,
  Pagination,
  Select,
  Tooltip,
} from '@tahti-player/ui';

import type { TahtiPlayable } from '../../api/types';
import { currentLocale } from '../../lib/locale';
import { resolveLocalPlayableForReplay } from '../../lib/nativeLibrary';
import { useLibraryStore, type HistoryEntry } from '../../stores/libraryStore';
import { usePlayerStore } from '../../stores/playerStore';
import { PageEmpty } from '../PageStates';

async function resolvePlayableForReplay(
  playable: TahtiPlayable,
): Promise<TahtiPlayable | null> {
  try {
    const resolved = await resolveLocalPlayableForReplay(playable);
    if (!resolved) {
      toast.error(i18n.t('web:library.history.reimport'));
    }
    return resolved;
  } catch (error) {
    toast.error(
      error instanceof Error
        ? error.message
        : i18n.t('web:library.history.trackUnavailable'),
    );
    return null;
  }
}

/** Resolves every entry for a bulk play/queue, dropping local files that
 * can no longer be reached and reporting the count once instead of one
 * toast per missing file. */
async function resolvePlayablesForReplay(
  playables: TahtiPlayable[],
): Promise<TahtiPlayable[]> {
  const resolved = await Promise.all(
    playables.map((p) => resolveLocalPlayableForReplay(p).catch(() => null)),
  );
  const available = resolved.filter((p): p is TahtiPlayable => p != null);
  const skipped = playables.length - available.length;
  if (skipped > 0) {
    toast.error(
      i18n.t('web:library.history.skippedUnavailable', { count: skipped }),
    );
  }
  return available;
}

function matchesFilter(entry: HistoryEntry, needle: string): boolean {
  const { title, artist } = entry.playable;
  return (
    title.toLowerCase().includes(needle) ||
    artist.toLowerCase().includes(needle)
  );
}

const PAGE_SIZES = [10, 25, 50];

function dayKey(playedAt: string): string {
  return playedAt.slice(0, 10);
}

function dayMarker(
  key: string,
  localeTag: string,
  todayLabel: string,
  yesterdayLabel: string,
): string {
  const today = dayKey(new Date().toISOString());
  const yesterday = dayKey(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  );
  if (key === today) {
    return todayLabel;
  }
  if (key === yesterday) {
    return yesterdayLabel;
  }
  return new Date(`${key}T00:00:00`).toLocaleDateString(localeTag, {
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
  const { t } = useTranslation('web');
  const localeTag = toBcp47(currentLocale());
  const toggleFavoriteTrack = useLibraryStore((s) => s.toggleFavoriteTrack);
  const isFavoriteTrack = useLibraryStore((s) => s.isFavoriteTrack);
  const clearHistory = useLibraryStore((s) => s.clearHistory);
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const enqueueMany = usePlayerStore((s) => s.enqueueMany);
  const currentId = usePlayerStore((s) => s.currentId);

  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]!);

  const filtered = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return needle
      ? history.filter((entry) => matchesFilter(entry, needle))
      : history;
  }, [history, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageEntries = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );
  const groups = useMemo(() => groupByDay(pageEntries), [pageEntries]);

  if (history.length === 0) {
    return (
      <PageEmpty
        data-testid="history-empty-state"
        title={t('library.history.emptyTitle')}
        description={t('library.history.emptyDescription')}
        className="flex-1"
      />
    );
  }

  const playAll = async () => {
    const [head, ...rest] = await resolvePlayablesForReplay(
      filtered.map((entry) => entry.playable),
    );
    if (head) {
      play(head, { enqueueRest: rest });
    }
  };

  const addAllToQueue = async () => {
    const added = enqueueMany(
      await resolvePlayablesForReplay(filtered.map((entry) => entry.playable)),
    );
    toast.success(
      added > 0
        ? t('library.history.addedToQueue', { count: added })
        : t('library.history.allQueued'),
    );
  };

  return (
    <div className="flex w-full flex-1 flex-col gap-6 py-4">
      <div
        data-testid="history-list-toolbar"
        className="flex flex-wrap items-center gap-2"
      >
        <Tooltip content={t('library.history.playAll')} side="bottom">
          <Button
            size="icon"
            aria-label={t('library.history.playAll')}
            disabled={filtered.length === 0}
            onClick={() => void playAll()}
          >
            <PlayIcon size={16} strokeWidth={3} />
          </Button>
        </Tooltip>
        <Tooltip content={t('library.history.addAllToQueue')} side="bottom">
          <Button
            variant="secondary"
            size="icon"
            aria-label={t('library.history.addAllToQueue')}
            disabled={filtered.length === 0}
            onClick={() => void addAllToQueue()}
          >
            <PlusIcon size={16} strokeWidth={3} />
          </Button>
        </Tooltip>
        <div className="ml-auto flex w-full max-w-sm items-center gap-2">
          <Input
            enterKeyHint="search"
            type="search"
            size="sm"
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              setPage(1);
            }}
            placeholder={t('library.history.filter')}
            aria-label={t('library.history.filter')}
            endAddon={
              <FilterIcon className="h-4 w-4" aria-hidden strokeWidth={3} />
            }
          />
          <Button variant="text" size="sm" onClick={clearHistory}>
            {t('library.history.clearAll')}
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <PageEmpty
          title={t('library.history.noMatch', { filter: filter.trim() })}
          action={
            <Button size="sm" variant="secondary" onClick={() => setFilter('')}>
              {t('library.history.clearFilter')}
            </Button>
          }
        />
      ) : null}

      {groups.map((group) => (
        <HistoryDayGroup
          key={group.key}
          marker={dayMarker(
            group.key,
            localeTag,
            t('date.today'),
            t('date.yesterday'),
          )}
        >
          {group.entries.map((entry) => {
            const p = entry.playable;
            return (
              <HistoryRow
                key={`${p.id}-${entry.playedAt}`}
                title={p.title}
                artist={p.artist}
                time={new Date(entry.playedAt).toLocaleTimeString(localeTag, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
                artworkUrl={p.coverUrl}
                isFavorite={isFavoriteTrack(p.id)}
                isActive={currentId === p.id}
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
                  favorite: t('actions.addToFavorites'),
                  unfavorite: t('actions.removeFromFavorites'),
                  addToQueue: t('library.history.addToQueue'),
                }}
              />
            );
          })}
        </HistoryDayGroup>
      ))}

      {filtered.length > PAGE_SIZES[0]! && (
        <footer
          data-testid="history-pagination"
          className="flex w-full flex-col gap-2 pb-6"
        >
          <div className="flex justify-end pr-1">
            <div data-testid="history-page-size" className="w-24">
              <Select
                aria-label={t('library.history.tracksPerPage')}
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
          {totalPages > 1 ? (
            <div className="flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
                labels={{
                  navigation: t('library.history.pagination'),
                  previous: t('library.history.previousPage'),
                  next: t('library.history.nextPage'),
                  page: (n) => t('library.history.page', { n }),
                }}
              />
            </div>
          ) : null}
        </footer>
      )}
    </div>
  );
}
