import { Link, useNavigate } from '@tanstack/react-router';
import {
  MicIcon,
  PlusIcon,
  RadioIcon,
  SearchIcon,
  UploadIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  ButtonLink,
  Dialog,
  FilterChips,
  Input,
  MediaArtwork,
  Textarea,
  Toggle,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import { patchBroadcastPreflight } from '../../api/broadcast';
import {
  createShowSeries,
  fetchEpisodesForShow,
  fetchShowSeries,
  type ShowMode,
  type StudioEpisode,
  type StudioShowSeries,
} from '../../api/shows';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { ShowImagePicker } from '../../components/ShowImagePicker';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';

export function StudioShowsView() {
  const navigate = useNavigate();
  const [shows, setShows] = useState<StudioShowSeries[]>([]);
  const [episodeCounts, setEpisodeCounts] = useState<Record<string, number>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [backdropFile, setBackdropFile] = useState<File | null>(null);
  const [intervalHours, setIntervalHours] = useState<1 | 2>(1);
  const [mode, setMode] = useState<ShowMode>('SERIES');
  const [autoPublish, setAutoPublish] = useState(true);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');

  const filteredShows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return shows;
    }
    return shows.filter((show) =>
      [show.title, show.description, show.scheduleNote].some((text) =>
        text?.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [query, shows]);

  const reload = () => {
    setLoading(true);
    void fetchShowSeries().then(async (res) => {
      setShows(res.data);
      setLoadError(
        res.meta.source === 'api' ? (res.meta.reason ?? null) : null,
      );
      const counts: Record<string, number> = {};
      await Promise.all(
        res.data.map(async (s) => {
          const eps = await fetchEpisodesForShow(s.id);
          counts[s.id] = eps.data.length;
        }),
      );
      setEpisodeCounts(counts);
      setLoading(false);
    });
  };

  useEffect(() => {
    reload();
  }, []);

  const create = async () => {
    if (!title.trim()) {
      return;
    }
    setBusy(true);
    const r = await createShowSeries({
      title: title.trim(),
      description: description.trim(),
      intervalHours,
      mode,
      autoPublish,
      coverUrl: thumbnailUrl.trim() || null,
      backdropUrl: backdropUrl.trim() || null,
    });
    setBusy(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    if (r.data.mode === 'SERIES') {
      await patchBroadcastPreflight({ seriesId: r.data.id });
    }
    setCreateOpen(false);
    setTitle('');
    setDescription('');
    setThumbnailUrl('');
    setBackdropUrl('');
    setThumbnailFile(null);
    setBackdropFile(null);
    setAutoPublish(true);
    void navigate({ to: '/studio/shows/$id', params: { id: r.data.id } });
  };

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <ViewShell
          title="Shows"
          classes={{ root: 'px-0 pt-0' }}
          actions={
            <Tooltip content="New show" side="top">
              <Button
                size="icon-sm"
                onClick={() => setCreateOpen(true)}
                aria-label="New show"
              >
                <PlusIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
          }
        >
          <Dialog.Root isOpen={createOpen} onClose={() => setCreateOpen(false)}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void create();
              }}
            >
              <Dialog.Title>
                <span className="inline-flex items-center gap-2">
                  <RadioIcon size={18} aria-hidden />
                  New show
                </span>
              </Dialog.Title>
              <Dialog.Description>
                Episodes inherit description, cover, and the next episode
                number.
              </Dialog.Description>
              <div className="mt-4 flex flex-col gap-3">
                <Input
                  label="Show title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
                <Textarea
                  submitOnModEnter
                  label="Description"
                  tone="secondary"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Copied to every new episode"
                />
                <ShowImagePicker
                  label="Show thumbnail"
                  description="JPEG, PNG, WebP, or GIF"
                  value={thumbnailUrl}
                  file={thumbnailFile}
                  onFile={(file) => {
                    setThumbnailFile(file);
                    setThumbnailUrl(file ? URL.createObjectURL(file) : '');
                  }}
                  onUrlChange={setThumbnailUrl}
                />
                <ShowImagePicker
                  label="Show backdrop"
                  description="Wide JPEG, PNG, WebP, or GIF"
                  value={backdropUrl}
                  file={backdropFile}
                  onFile={(file) => {
                    setBackdropFile(file);
                    setBackdropUrl(file ? URL.createObjectURL(file) : '');
                  }}
                  onUrlChange={setBackdropUrl}
                />
                <div className="border-border bg-background-secondary/30 flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
                  <span>
                    <span className="block font-medium">
                      Record broadcasts by default
                    </span>
                    <span className="text-foreground-secondary block text-xs">
                      New broadcasts for this show will start with recording
                      enabled.
                    </span>
                  </span>
                  <Toggle
                    label="Record broadcasts by default"
                    checked={autoPublish}
                    onChange={setAutoPublish}
                  />
                </div>
                <FilterChips
                  items={[
                    { id: 'SERIES', label: 'Continuing series' },
                    { id: 'SINGLE', label: 'Single show' },
                  ]}
                  selected={mode}
                  onChange={(id) => setMode(id as ShowMode)}
                  aria-label="Show mode"
                />
                {mode === 'SERIES' ? (
                  <FilterChips
                    items={[
                      { id: '1', label: '1 hour' },
                      { id: '2', label: '2 hours' },
                    ]}
                    selected={String(intervalHours)}
                    onChange={(id) => setIntervalHours(Number(id) as 1 | 2)}
                    aria-label="Episode length"
                  />
                ) : null}
              </div>
              <Dialog.Actions>
                <Dialog.Close>Cancel</Dialog.Close>
                <Button type="submit" disabled={busy || !title.trim()}>
                  {busy ? 'Creating…' : 'Create show'}
                </Button>
              </Dialog.Actions>
            </form>
          </Dialog.Root>

          <StudioPanel>
            {loading ? (
              <PageLoading label="Loading…" />
            ) : loadError && shows.length === 0 ? (
              <PageError
                title="Could not load your shows"
                description={loadError}
                onRetry={reload}
              />
            ) : shows.length === 0 ? (
              <PageEmpty
                title="No shows yet"
                description="Create one to start numbering episodes."
                action={
                  <Tooltip content="New show" side="top">
                    <Button
                      size="icon-sm"
                      variant="secondary"
                      onClick={() => setCreateOpen(true)}
                      aria-label="New show"
                    >
                      <PlusIcon size={16} aria-hidden />
                    </Button>
                  </Tooltip>
                }
              />
            ) : (
              <>
                <Input
                  enterKeyHint="search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search shows…"
                  aria-label="Search shows"
                  className="mb-4"
                  startAddon={
                    <SearchIcon size={14} aria-hidden className="opacity-70" />
                  }
                />
                {filteredShows.length === 0 ? (
                  <PageEmpty
                    title="No shows match this search."
                    action={
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setQuery('')}
                      >
                        Clear search
                      </Button>
                    }
                  />
                ) : (
                  <ul className="divide-border divide-y">
                    {filteredShows.map((s) => (
                      <ShowRow
                        key={s.id}
                        show={s}
                        episodeCount={episodeCounts[s.id] ?? 0}
                      />
                    ))}
                  </ul>
                )}
              </>
            )}
          </StudioPanel>
        </ViewShell>
      </div>
    </StudioGate>
  );
}

function ShowRow({
  show,
  episodeCount,
}: {
  show: StudioShowSeries;
  episodeCount: number;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
      <MediaArtwork
        size="md"
        src={show.coverUrl}
        alt=""
        className="border-border bg-background-secondary size-20 rounded-lg border"
        placeholder={<RadioIcon size={28} className="opacity-40" aria-hidden />}
      />
      <div className="min-w-40 flex-1">
        <Link
          to="/studio/shows/$id"
          params={{ id: show.id }}
          className="font-medium hover:underline"
        >
          {show.title}
        </Link>
        <p className="text-foreground-secondary text-xs">
          Next episode #{show.nextEpisodeNumber}
          {episodeCount
            ? `, ${episodeCount} ${episodeCount === 1 ? 'episode' : 'episodes'}`
            : ''}
          {`, ${show.intervalHours}h slots`}
          {show.scheduleNote ? `, ${show.scheduleNote}` : ''}
          {show.mode === 'SINGLE' ? ', single show' : ', continuing series'}
        </p>
      </div>
      <ButtonLink
        to="/studio/shows/$id"
        params={{ id: show.id }}
        size="sm"
        variant="secondary"
      >
        Manage
      </ButtonLink>
    </li>
  );
}

export function episodeStatusLabel(ep: StudioEpisode): string {
  switch (ep.status) {
    case 'PENDING_APPROVAL':
      return 'Needs approval';
    case 'APPROVED':
      return 'Approved';
    case 'SCHEDULED':
      return 'Scheduled';
    case 'LIVE':
      return 'Live';
    default:
      return 'Draft';
  }
}

export function EpisodeSourceIcon({
  source,
}: {
  source: StudioEpisode['source'];
}) {
  return source === 'broadcast' ? (
    <MicIcon size={14} aria-hidden />
  ) : (
    <UploadIcon size={14} aria-hidden />
  );
}
