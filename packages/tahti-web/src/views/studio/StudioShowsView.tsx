import { Link, useNavigate } from '@tanstack/react-router';
import { MicIcon, PlusIcon, RadioIcon, UploadIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Button,
  Dialog,
  EmptyState,
  FilterChips,
  Input,
  MediaArtwork,
  Textarea,
  Toggle,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  createShowSeries,
  fetchEpisodesForShow,
  fetchShowSeries,
  type ShowMode,
  type StudioEpisode,
  type StudioShowSeries,
} from '../../api/shows';
import { PageLoading } from '../../components/PageStates';
import { ShowImagePicker } from '../../components/ShowImagePicker';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';

export function StudioShowsView() {
  const navigate = useNavigate();
  const [shows, setShows] = useState<StudioShowSeries[]>([]);
  const [episodeCounts, setEpisodeCounts] = useState<Record<string, number>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [backdropFile, setBackdropFile] = useState<File | null>(null);
  const [intervalHours, setIntervalHours] = useState<1 | 2>(1);
  const [mode, setMode] = useState<ShowMode>('SERIES');
  const [autoArchive, setAutoArchive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    void fetchShowSeries().then(async (res) => {
      setShows(res.data);
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
    setMsg(null);
    const r = await createShowSeries({
      title: title.trim(),
      description: description.trim(),
      intervalHours,
      mode,
      autoArchive,
      coverUrl: thumbnailUrl.trim() || null,
      backdropUrl: backdropUrl.trim() || null,
    });
    setBusy(false);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setCreateOpen(false);
    setTitle('');
    setDescription('');
    setThumbnailUrl('');
    setBackdropUrl('');
    setThumbnailFile(null);
    setBackdropFile(null);
    setAutoArchive(true);
    void navigate({ to: '/studio/shows/$id', params: { id: r.data.id } });
  };

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/shows" />
        <ViewShell
          title="Shows"
          subtitle="Episodes, slots, and series."
          classes={{ root: 'px-0 pt-0' }}
        >
          <div className="mb-4">
            <Tooltip content="New show" side="top">
              <Button
                size="icon-sm"
                onClick={() => setCreateOpen(true)}
                aria-label="New show"
              >
                <PlusIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
          </div>

          {msg && (
            <p className="text-foreground-secondary mb-4 text-sm">{msg}</p>
          )}

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
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground-secondary text-xs uppercase">
                    Description
                  </span>
                  <Textarea
                    tone="secondary"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Copied to every new episode"
                  />
                </label>
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
                    checked={autoArchive}
                    onChange={setAutoArchive}
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
            ) : shows.length === 0 ? (
              <EmptyState
                size="sm"
                title="No shows yet"
                description="Create one to start numbering episodes."
                action={
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
              />
            ) : (
              <ul className="divide-border divide-y">
                {shows.map((s) => (
                  <ShowRow
                    key={s.id}
                    show={s}
                    episodeCount={episodeCounts[s.id] ?? 0}
                  />
                ))}
              </ul>
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
      <div className="min-w-0 flex-1">
        <Link
          to="/studio/shows/$id"
          params={{ id: show.id }}
          className="font-medium hover:underline"
        >
          {show.title}
        </Link>
        <p className="text-foreground-secondary text-xs">
          Next episode #{show.nextEpisodeNumber}
          {episodeCount ? `, ${episodeCount} episodes` : ''}
          {`, ${show.intervalHours}h slots`}
          {show.scheduleNote ? `, ${show.scheduleNote}` : ''}
          {show.mode === 'SINGLE' ? ', single show' : ', continuing series'}
        </p>
      </div>
      <Link to="/studio/shows/$id" params={{ id: show.id }}>
        <Button size="sm" variant="secondary">
          Manage
        </Button>
      </Link>
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
