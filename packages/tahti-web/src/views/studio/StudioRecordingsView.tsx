import { Link } from '@tanstack/react-router';
import {
  CheckIcon,
  PencilIcon,
  RadioIcon,
  SearchIcon,
  UploadCloudIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  Button,
  EmptyState,
  Input,
  Select,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  fetchRecentBroadcasts,
  type RecentBroadcast,
} from '../../api/broadcast';
import {
  fetchShowRefByArchiveItemId,
  type ShowRefByArchiveItemId,
} from '../../api/shows';
import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';
import { TrackEditDialog } from '../../components/TrackEditDialog';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(seconds: number | undefined): string {
  if (!seconds) {
    return '';
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

const isPublished = (show: RecentBroadcast) => show.soundStatus === 'READY';

/** Fallback grouping for recordings with no matching episode (e.g. an
 * ad-hoc "Go Live" session never tied to a scheduled show) — the closest
 * thing to a show name without a real reference. */
const untitledGroupKey = (show: RecentBroadcast) =>
  (show.title || show.soundTitle || 'Untitled recordings').trim();

type SortKey = 'newest' | 'oldest' | 'title';

function sortShows(list: RecentBroadcast[], sort: SortKey): RecentBroadcast[] {
  return [...list].sort((left, right) => {
    if (sort === 'title') {
      return (left.title || left.soundTitle || '').localeCompare(
        right.title || right.soundTitle || '',
      );
    }
    const leftTime = new Date(left.startedAt).getTime();
    const rightTime = new Date(right.startedAt).getTime();
    return sort === 'newest' ? rightTime - leftTime : leftTime - rightTime;
  });
}

type ShowGroup = {
  key: string;
  title: string;
  /** Set only when the group is a real show reference, not the title
   * fallback — lets the group header link to the actual show. */
  showId: string | null;
  items: RecentBroadcast[];
};

function groupByShow(
  items: RecentBroadcast[],
  showRefByArchiveItemId: ShowRefByArchiveItemId,
): ShowGroup[] {
  const map = new Map<string, ShowGroup>();
  for (const item of items) {
    const ref = item.soundId
      ? showRefByArchiveItemId.get(item.soundId)
      : undefined;
    const key = ref ? `show:${ref.showId}` : `title:${untitledGroupKey(item)}`;
    const existing = map.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      map.set(key, {
        key,
        title: ref ? ref.title : untitledGroupKey(item),
        showId: ref?.showId ?? null,
        items: [item],
      });
    }
  }
  return [...map.values()].sort((a, b) => {
    const latest = (group: RecentBroadcast[]) =>
      Math.max(...group.map((i) => new Date(i.startedAt).getTime()));
    return latest(b.items) - latest(a.items);
  });
}

/** Same row treatment as the Sounds tab (MyDiscographyView) — thumbnail
 * box, title, subtitle, status badge, and an edit action — reused here
 * rather than a new listing widget. Recordings carry no artwork/waveform
 * data, so the thumbnail is always the placeholder icon. */
function RecordingRow({
  show,
  index,
  onEdit,
}: {
  show: RecentBroadcast;
  index: number;
  onEdit: (soundId: string) => void;
}) {
  const title =
    show.title || show.soundTitle || `Show ${formatDate(show.startedAt)}`;
  const published = isPublished(show);

  return (
    <li
      className={`flex items-center gap-3 border-l-4 p-3 transition-colors ${
        published
          ? `border-l-transparent ${index % 2 === 0 ? 'bg-background-secondary/55' : 'bg-background'}`
          : 'border-l-primary bg-primary/10'
      }`}
    >
      <div className="border-border bg-background-secondary flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
        <RadioIcon
          size={18}
          aria-hidden
          className="text-foreground-secondary"
        />
      </div>
      <div className="min-w-0 flex-1">
        {show.soundId ? (
          <Link
            to="/studio/sounds/$id"
            params={{ id: show.soundId }}
            className="block truncate font-semibold hover:underline"
          >
            {title}
          </Link>
        ) : (
          <span className="block truncate font-semibold">{title}</span>
        )}
        <p className="text-foreground-secondary truncate text-xs">
          {formatDate(show.startedAt)}
          {show.durationSec ? ` · ${formatDuration(show.durationSec)}` : ''}
          {show.source
            ? ` · ${show.source.toLowerCase().replace('_', ' ')}`
            : ''}
        </p>
        <span
          className={`mt-1 inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase ${
            published ? 'text-accent-green' : 'text-primary'
          }`}
        >
          {published && <CheckIcon size={11} aria-hidden />}
          {published ? 'Published' : 'Draft'}
        </span>
      </div>
      {show.soundId ? (
        <Tooltip content="Edit track" side="top">
          <Button
            size="icon-sm"
            variant="text"
            aria-label={`Edit ${title}`}
            onClick={() => onEdit(show.soundId!)}
          >
            <PencilIcon size={16} aria-hidden />
          </Button>
        </Tooltip>
      ) : (
        <Link to="/studio/sounds">
          <Button size="sm" variant="secondary">
            <UploadCloudIcon size={14} aria-hidden className="mr-1.5" />
            Publish
          </Button>
        </Link>
      )}
    </li>
  );
}

export function StudioRecordingsView({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [recordings, setRecordings] = useState<RecentBroadcast[]>([]);
  const [showRefByArchiveItemId, setShowRefByArchiveItemId] =
    useState<ShowRefByArchiveItemId>(new Map());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [editingArchiveId, setEditingArchiveId] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    void Promise.all([
      fetchRecentBroadcasts(500),
      fetchShowRefByArchiveItemId(),
    ]).then(([broadcastsRes, showRefRes]) => {
      setRecordings(broadcastsRes.data);
      setShowRefByArchiveItemId(showRefRes.data);
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
    return groupByShow(published, showRefByArchiveItemId).map((group) => ({
      ...group,
      items: sortShows(group.items, sort),
    }));
  }, [filtered, sort, showRefByArchiveItemId]);

  const browseShowsAction = (
    <Link to="/studio/shows">
      <Button size="sm" variant="secondary">
        Browse shows
      </Button>
    </Link>
  );

  const content = (
    <div
      className={`${embedded ? 'flex' : 'studio-page-layout'} mx-auto w-full max-w-3xl flex-col gap-6 px-1 py-2`}
    >
      {!embedded ? <StudioNav current="/studio/recordings" /> : null}
      {!embedded ? (
        <ViewShell
          title="Recordings"
          subtitle="Completed show recordings."
          classes={{ root: 'px-0 pt-0' }}
        >
          <div className="mb-4">{browseShowsAction}</div>
          <StudioPanel
            title={`Recordings (${recordings.length})`}
            description="Every completed show recording, grouped by show — drafts that haven't been published yet are pinned at the top."
          >
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search recordings…"
                aria-label="Search recordings"
                endAddon={<SearchIcon size={16} aria-hidden />}
              />
              <Select
                label="Sort recordings"
                value={sort}
                onValueChange={(value) => setSort(value as SortKey)}
                options={[
                  { id: 'newest', label: 'Newest first' },
                  { id: 'oldest', label: 'Oldest first' },
                  { id: 'title', label: 'Title A–Z' },
                ]}
                className="sm:w-44"
              />
            </div>
            {loading ? (
              <PageLoading label="Loading…" />
            ) : filtered.length === 0 ? (
              <EmptyState
                size="sm"
                title={
                  recordings.length === 0
                    ? 'No recorded shows yet'
                    : 'No recordings match your search'
                }
                description={
                  recordings.length === 0
                    ? 'Enable recording when you go live and completed shows will appear here.'
                    : undefined
                }
                action={
                  recordings.length === 0 ? (
                    <Link to="/studio/go-live">
                      <Button size="sm" variant="secondary">
                        <RadioIcon size={14} aria-hidden className="mr-1" />
                        Open broadcast studio
                      </Button>
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              <div className="flex flex-col gap-6">
                {drafts.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <h3 className="text-primary text-xs font-semibold tracking-wide uppercase">
                      Drafts · not yet published ({drafts.length})
                    </h3>
                    <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
                      {drafts.map((show, index) => (
                        <RecordingRow
                          key={show.id}
                          show={show}
                          index={index}
                          onEdit={setEditingArchiveId}
                        />
                      ))}
                    </ul>
                  </div>
                ) : null}

                {groups.map((group) => (
                  <div key={group.key} className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold">
                      {group.showId ? (
                        <Link
                          to="/studio/shows/$id"
                          params={{ id: group.showId }}
                          className="hover:underline"
                        >
                          {group.title}
                        </Link>
                      ) : (
                        group.title
                      )}{' '}
                      <span className="text-foreground-secondary font-normal">
                        ({group.items.length})
                      </span>
                    </h3>
                    <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
                      {group.items.map((show, index) => (
                        <RecordingRow
                          key={show.id}
                          show={show}
                          index={index}
                          onEdit={setEditingArchiveId}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </StudioPanel>
          <TrackEditDialog
            soundId={editingArchiveId}
            onClose={() => setEditingArchiveId(null)}
            onSaved={reload}
          />
        </ViewShell>
      ) : (
        <>
          <StudioPanel
            title={`Recordings (${recordings.length})`}
            description="Every completed show recording, grouped by show — drafts that haven't been published yet are pinned at the top."
            action={browseShowsAction}
          >
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search recordings…"
                aria-label="Search recordings"
                endAddon={<SearchIcon size={16} aria-hidden />}
              />
              <Select
                label="Sort recordings"
                value={sort}
                onValueChange={(value) => setSort(value as SortKey)}
                options={[
                  { id: 'newest', label: 'Newest first' },
                  { id: 'oldest', label: 'Oldest first' },
                  { id: 'title', label: 'Title A–Z' },
                ]}
                className="sm:w-44"
              />
            </div>
            {loading ? (
              <PageLoading label="Loading…" />
            ) : filtered.length === 0 ? (
              <EmptyState
                size="sm"
                title={
                  recordings.length === 0
                    ? 'No recorded shows yet'
                    : 'No recordings match your search'
                }
                description={
                  recordings.length === 0
                    ? 'Enable recording when you go live and completed shows will appear here.'
                    : undefined
                }
                action={
                  recordings.length === 0 ? (
                    <Link to="/studio/go-live">
                      <Button size="sm" variant="secondary">
                        <RadioIcon size={14} aria-hidden className="mr-1" />
                        Open broadcast studio
                      </Button>
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              <div className="flex flex-col gap-6">
                {drafts.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <h3 className="text-primary text-xs font-semibold tracking-wide uppercase">
                      Drafts · not yet published ({drafts.length})
                    </h3>
                    <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
                      {drafts.map((show, index) => (
                        <RecordingRow
                          key={show.id}
                          show={show}
                          index={index}
                          onEdit={setEditingArchiveId}
                        />
                      ))}
                    </ul>
                  </div>
                ) : null}

                {groups.map((group) => (
                  <div key={group.key} className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold">
                      {group.showId ? (
                        <Link
                          to="/studio/shows/$id"
                          params={{ id: group.showId }}
                          className="hover:underline"
                        >
                          {group.title}
                        </Link>
                      ) : (
                        group.title
                      )}{' '}
                      <span className="text-foreground-secondary font-normal">
                        ({group.items.length})
                      </span>
                    </h3>
                    <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
                      {group.items.map((show, index) => (
                        <RecordingRow
                          key={show.id}
                          show={show}
                          index={index}
                          onEdit={setEditingArchiveId}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </StudioPanel>
          <TrackEditDialog
            soundId={editingArchiveId}
            onClose={() => setEditingArchiveId(null)}
            onSaved={reload}
          />
        </>
      )}
    </div>
  );

  return embedded ? content : <StudioGate>{content}</StudioGate>;
}
