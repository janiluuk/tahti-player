import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import {
  AudioLinesIcon,
  BarChart3Icon,
  ChevronDownIcon,
  DownloadIcon,
  FilterIcon,
  FolderIcon,
  PencilIcon,
  PlayIcon,
  SearchIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  EmptyState,
  Input,
  Select,
  TabLabel,
  Tabs,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  deleteStudioSound,
  fetchEditorSource,
  fetchStudioSoundDownload,
  fetchStudioSounds,
  patchStudioSound,
} from '../../api/studio';
import type { StudioSound } from '../../api/studio-types';
import { AddToMusicActions } from '../../components/AddToMusicActions';
import { AddToPlaylistButton } from '../../components/AddToPlaylistButton';
import { PageLoading } from '../../components/PageStates';
import { StashFilesPanel } from '../../components/StashFilesPanel';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';
import { StudioSoundRowMenu } from '../../components/StudioSoundRowMenu';
import { TrackEditDialog } from '../../components/TrackEditDialog';
import { TrackInsightsPanel } from '../../components/TrackInsightsPanel';
import { playableFromStudioHearthis } from '../../lib/embedPlayback';
import {
  EMBED_PROVIDER_HEIGHT,
  EMBED_PROVIDER_LABEL,
  embedSrcFor,
  type EmbedProvider,
} from '../../lib/embedSrc';
import {
  countPinnedTracks,
  isPinned,
  sortPinnedFirst,
} from '../../lib/pinnedTracks';
import { usePlayerStore } from '../../stores/playerStore';

const FOLDERS = [
  { id: 'archive' as const, label: 'Sounds', icon: AudioLinesIcon },
  { id: 'clips' as const, label: 'Clips', icon: AudioLinesIcon },
  { id: 'files' as const, label: 'Move to stash', icon: FolderIcon },
];

type EmbedFilter = 'ALL' | 'NATIVE' | EmbedProvider;
type SortField = 'title' | 'uploaded' | 'duration';

const EMBED_FILTERS: Array<{ id: EmbedFilter; label: string }> = [
  { id: 'ALL', label: 'All sources' },
  { id: 'NATIVE', label: 'Tahti audio' },
  { id: 'HEARTHIS', label: 'hearthis.at' },
  { id: 'MIXCLOUD', label: 'Mixcloud' },
  { id: 'SPOTIFY', label: 'Spotify' },
  { id: 'BANDCAMP', label: 'Bandcamp' },
];

const SORT_FIELDS: Array<{ id: SortField; label: string }> = [
  { id: 'title', label: 'Title' },
  { id: 'uploaded', label: 'Upload date' },
  { id: 'duration', label: 'Duration' },
];

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseDateInput(value: string): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatUploadDate(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function StudioSoundsView() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { folder?: string };
  const folder =
    search.folder === 'files'
      ? 'files'
      : search.folder === 'clips'
        ? 'clips'
        : 'archive';
  const [items, setItems] = useState<StudioSound[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [embedFilter, setEmbedFilter] = useState<EmbedFilter>('ALL');
  const [sortField, setSortField] = useState<SortField>('uploaded');
  const [sortDescending, setSortDescending] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [uploadedFrom, setUploadedFrom] = useState('');
  const [uploadedTo, setUploadedTo] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [embedOpenId, setEmbedOpenId] = useState<string | null>(null);
  const [statsItem, setStatsItem] = useState<StudioSound | null>(null);
  const play = usePlayerStore((s) => s.play);

  const reload = () => {
    setLoading(true);
    void fetchStudioSounds().then((res) => {
      setItems(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = parseDateInput(uploadedFrom);
    const to = parseDateInput(uploadedTo);
    const toExclusive = to ? new Date(to.getTime() + DAY_IN_MS) : null;
    const base = !q
      ? items
      : items.filter(
          (i) =>
            i.title.toLowerCase().includes(q) ||
            (i.genre?.toLowerCase().includes(q) ?? false) ||
            i.status.toLowerCase().includes(q),
        );
    const filteredItems = base.filter((item) => {
      if (folder === 'clips' && item.contentType !== 'CLIP') {
        return false;
      }
      if (folder === 'archive' && item.contentType === 'CLIP') {
        return false;
      }
      const provider = item.embedProvider ?? 'NATIVE';
      if (embedFilter !== 'ALL' && provider !== embedFilter) {
        return false;
      }
      if (!item.createdAt) {
        return !from && !toExclusive;
      }
      const uploadedAt = new Date(item.createdAt);
      if (Number.isNaN(uploadedAt.getTime())) {
        return !from && !toExclusive;
      }
      return (
        (!from || uploadedAt >= from) &&
        (!toExclusive || uploadedAt < toExclusive)
      );
    });
    return sortPinnedFirst(filteredItems).sort((left, right) => {
      const comparison =
        sortField === 'title'
          ? left.title.localeCompare(right.title)
          : sortField === 'duration'
            ? (left.durationSec ?? 0) - (right.durationSec ?? 0)
            : new Date(left.createdAt ?? 0).getTime() -
              new Date(right.createdAt ?? 0).getTime();
      return sortDescending ? -comparison : comparison;
    });
  }, [
    embedFilter,
    items,
    query,
    sortDescending,
    sortField,
    uploadedFrom,
    uploadedTo,
    folder,
  ]);

  const pinnedCount = countPinnedTracks(items);

  const playItem = async (id: string, title: string) => {
    setBusyId(id);
    const { data } = await fetchEditorSource(id);
    play({
      id: `archive:${id}`,
      kind: 'archive',
      title: data.title || title,
      artist: 'You',
      streamUrl: data.url,
      protocol: data.url.includes('.m3u8') ? 'hls' : 'https',
    });
    setBusyId(null);
  };

  const playEmbedItem = (item: StudioSound) => {
    const hearthis = playableFromStudioHearthis(item);
    if (hearthis) {
      play(hearthis);
      setEmbedOpenId(null);
      return;
    }
    setEmbedOpenId((id) => (id === item.id ? null : item.id));
  };

  const downloadItem = async (item: StudioSound) => {
    setBusyId(item.id);
    const result = await fetchStudioSoundDownload(item.id);
    setBusyId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const link = document.createElement('a');
    link.href = result.url;
    link.download = result.filename ?? `${item.title}.audio`;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const togglePin = async (item: StudioSound) => {
    const next = !isPinned(item);
    setBusyId(item.id);
    const result = await patchStudioSound(item.id, { pinned: next });
    setBusyId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setItems((prev) =>
      prev.map((row) => (row.id === item.id ? result.data : row)),
    );
  };

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/sounds" />
        <ViewShell
          title="Sounds"
          subtitle="Your files."
          classes={{ root: 'px-0 pt-0' }}
        >
          {folder === 'archive' ? (
            <div className="mb-4">
              <AddToMusicActions onUploaded={reload} />
            </div>
          ) : null}

          <Tabs.Root
            selectedIndex={FOLDERS.findIndex((entry) => entry.id === folder)}
            onChange={(index) => {
              const next = FOLDERS[index];
              if (!next) {
                return;
              }
              void navigate({
                to: '/studio/sounds',
                search: next.id === 'archive' ? {} : { folder: next.id },
              });
            }}
          >
            <Tabs.List>
              {FOLDERS.map((folderOption) => (
                <Tabs.Tab key={folderOption.id}>
                  <TabLabel icon={<folderOption.icon size={14} />}>
                    {folderOption.label}
                  </TabLabel>
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.Root>

          {folder === 'files' ? (
            <StashFilesPanel />
          ) : (
            <StudioPanel>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Input
                  type="search"
                  aria-label="Search archive"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search…"
                  className="max-w-md flex-1"
                  startAddon={
                    <SearchIcon size={14} aria-hidden className="opacity-70" />
                  }
                />
                <Tooltip
                  content={filtersOpen ? 'Collapse filters' : 'Expand filters'}
                  side="top"
                >
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="secondary"
                    aria-expanded={filtersOpen}
                    aria-label={
                      filtersOpen ? 'Collapse filters' : 'Expand filters'
                    }
                    onClick={() => setFiltersOpen((current) => !current)}
                  >
                    <FilterIcon size={15} aria-hidden />
                    <ChevronDownIcon
                      size={13}
                      aria-hidden
                      className={filtersOpen ? 'rotate-180' : ''}
                    />
                  </Button>
                </Tooltip>
                <span className="text-foreground-secondary text-xs">
                  Pinned {pinnedCount}
                </span>
              </div>
              {filtersOpen && (
                <div className="border-border mb-4 flex flex-wrap items-end gap-3 border-b pb-4">
                  <Select
                    label="Source"
                    value={embedFilter}
                    onValueChange={(value) =>
                      setEmbedFilter(value as EmbedFilter)
                    }
                    options={EMBED_FILTERS.map((filterOption) => ({
                      id: filterOption.id,
                      label: filterOption.label,
                    }))}
                    className="min-w-40"
                  />
                  <Select
                    label="Sort by"
                    value={sortField}
                    onValueChange={(value) => setSortField(value as SortField)}
                    options={SORT_FIELDS.map((sortOption) => ({
                      id: sortOption.id,
                      label: sortOption.label,
                    }))}
                    className="min-w-40"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSortDescending((current) => !current)}
                  >
                    {sortDescending ? 'Descending' : 'Ascending'}
                  </Button>
                  <Input
                    type="date"
                    label="Uploaded from"
                    value={uploadedFrom}
                    onChange={(event) => setUploadedFrom(event.target.value)}
                    className="min-w-36"
                  />
                  <Input
                    type="date"
                    label="Uploaded to"
                    value={uploadedTo}
                    onChange={(event) => setUploadedTo(event.target.value)}
                    className="min-w-36"
                  />
                </div>
              )}

              {loading ? (
                <PageLoading label="Loading…" />
              ) : filtered.length === 0 ? (
                <EmptyState
                  size="sm"
                  title="No tracks yet"
                  description="Upload a file or import from Sources."
                  action={
                    <AddToMusicActions align="center" onUploaded={reload} />
                  }
                />
              ) : (
                <ul className="divide-border divide-y">
                  {filtered.map((item) => {
                    const embedSrc =
                      item.embedProvider && item.embedUri
                        ? embedSrcFor(item.embedProvider, item.embedUri)
                        : null;
                    return (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center gap-2 py-3 text-sm first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1">
                          <Link
                            to="/t/$id"
                            params={{ id: item.id }}
                            className="font-medium hover:underline"
                          >
                            {item.title}
                          </Link>
                          <p className="text-foreground-secondary text-xs">
                            {item.status}
                            {formatUploadDate(item.createdAt)
                              ? `, uploaded ${formatUploadDate(item.createdAt)}`
                              : ''}
                            {isPinned(item) ? ', pinned' : ''}
                            {item.durationSec != null
                              ? `, ${Math.round(item.durationSec / 60)} min`
                              : ''}
                            {item.genre ? `, ${item.genre}` : ''}
                            {item.isPublic === false ? ', private' : ''}
                            {embedSrc
                              ? `, via ${EMBED_PROVIDER_LABEL[item.embedProvider!]}`
                              : ''}
                          </p>
                        </div>
                        <Tooltip
                          content={
                            embedSrc
                              ? `Play on ${EMBED_PROVIDER_LABEL[item.embedProvider!]}`
                              : 'Play'
                          }
                          side="top"
                        >
                          <Button
                            size="icon-sm"
                            disabled={busyId === item.id}
                            onClick={() =>
                              embedSrc
                                ? void playEmbedItem(item)
                                : void playItem(item.id, item.title)
                            }
                            aria-label={
                              embedSrc
                                ? `Play ${item.title} on ${EMBED_PROVIDER_LABEL[item.embedProvider!]}`
                                : `Play ${item.title}`
                            }
                          >
                            <PlayIcon size={16} aria-hidden />
                          </Button>
                        </Tooltip>
                        {item.downloadsEnabled ? (
                          <Tooltip content="Download original" side="top">
                            <Button
                              size="icon-sm"
                              variant="text"
                              disabled={busyId === item.id}
                              onClick={() => void downloadItem(item)}
                              aria-label={`Download ${item.title}`}
                            >
                              <DownloadIcon size={16} aria-hidden />
                            </Button>
                          </Tooltip>
                        ) : null}
                        <Tooltip content="Edit track" side="top">
                          <Button
                            size="icon-sm"
                            variant="secondary"
                            aria-label={`Edit ${item.title}`}
                            onClick={() => setEditingId(item.id)}
                          >
                            <PencilIcon size={16} aria-hidden />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Stats" side="top">
                          <Button
                            size="icon-sm"
                            variant="text"
                            onClick={() => setStatsItem(item)}
                            aria-label={`Show stats for ${item.title}`}
                          >
                            <BarChart3Icon size={16} aria-hidden />
                          </Button>
                        </Tooltip>
                        <AddToPlaylistButton
                          soundId={item.id}
                          trackTitle={item.title}
                        />
                        <StudioSoundRowMenu
                          item={item}
                          busy={busyId === item.id}
                          hasEmbed={Boolean(embedSrc)}
                          onTogglePin={() => void togglePin(item)}
                          onDelete={() => {
                            if (!confirm(`Delete “${item.title}”?`)) {
                              return;
                            }
                            void deleteStudioSound(item.id).then(() =>
                              reload(),
                            );
                          }}
                        />
                        {embedSrc && embedOpenId === item.id && (
                          <iframe
                            title={item.title}
                            src={embedSrc}
                            width="100%"
                            height={EMBED_PROVIDER_HEIGHT[item.embedProvider!]}
                            style={{ border: 0, display: 'block' }}
                            allow="autoplay; encrypted-media"
                            loading="lazy"
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </StudioPanel>
          )}
        </ViewShell>
        <TrackEditDialog
          soundId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={(saved) =>
            setItems((current) =>
              current.map((item) => (item.id === saved.id ? saved : item)),
            )
          }
        />
      </div>
      <Dialog.Root
        isOpen={Boolean(statsItem)}
        onClose={() => setStatsItem(null)}
        className="max-w-3xl"
      >
        <Dialog.Title>{statsItem?.title ?? 'Track stats'}</Dialog.Title>
        <Dialog.Description>
          Plays, downloads, and listener geography for this sound.
        </Dialog.Description>
        {statsItem ? (
          <TrackInsightsPanel kind="sound" id={statsItem.id} />
        ) : null}
        <Dialog.Actions>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
    </StudioGate>
  );
}
