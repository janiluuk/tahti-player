import { Link, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  CalendarPlusIcon,
  CircleDotIcon,
  InfoIcon,
  ListMusicIcon,
  MicIcon,
  PlayIcon,
  PlusIcon,
  UploadIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  FilePicker,
  FilterChips,
  Input,
  SaveButton,
  TabLabel,
  Tabs,
  Textarea,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import {
  createEpisode,
  createShowBooking,
  fetchEpisodesForShow,
  fetchShowBookings,
  fetchShowSeriesById,
  patchShowSeries,
  type StudioEpisode,
  type StudioShowBooking,
  type StudioShowSeries,
} from '../../api/shows';
import { uploadSoundFile } from '../../api/studio';
import { uploadUserMediaFile } from '../../api/user-media';
import { EntitySocialHeader } from '../../components/EntitySocialHeader';
import { PageEmpty, PageLoading } from '../../components/PageStates';
import { ShowImagePicker } from '../../components/ShowImagePicker';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { EpisodeEditorRow } from './show-detail/EpisodeEditorRow';
import { EpisodeSourceIcon, episodeStatusLabel } from './StudioShowsView';

/** Picked images are previewed through blob: URLs; free them when replaced. */
function revokeBlobUrl(url: string) {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

export function StudioShowDetailView({ id }: { id: string }) {
  const navigate = useNavigate();
  const [show, setShow] = useState<StudioShowSeries | null>(null);
  const [episodes, setEpisodes] = useState<StudioEpisode[]>([]);
  const [bookings, setBookings] = useState<StudioShowBooking[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [source, setSource] = useState<'upload' | 'broadcast'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [backdropFile, setBackdropFile] = useState<File | null>(null);
  const [autoPublish, setAutoPublish] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showTab, setShowTab] = useState<
    'overview' | 'episodes' | 'recordings'
  >('overview');
  const recordingCount = episodes.filter(
    (episode) => episode.source === 'broadcast',
  ).length;

  const reload = () => {
    fetchShowSeriesById(id)
      .then((r) => {
        setShow(r.data);
        if (r.data) {
          setTitle(r.data.title);
          setDescription(r.data.description);
          setThumbnailUrl(r.data.coverUrl ?? '');
          setBackdropUrl(r.data.backdropUrl ?? '');
          setAutoPublish(r.data.autoPublish ?? true);
        }
      })
      .catch(() => toast.error('Could not load the show.'))
      .finally(() => setLoaded(true));
    fetchEpisodesForShow(id)
      .then((r) => setEpisodes(r.data))
      .catch(() => toast.error('Could not load the episodes.'));
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 14 * 24 * 3600_000).toISOString();
    fetchShowBookings(from, to)
      .then((r) => setBookings(r.data.filter((b) => b.isMine)))
      .catch(() => undefined);
  };

  useEffect(() => {
    reload();
  }, [id]);

  const nextEpisodeNumber = show?.nextEpisodeNumber ?? 1;
  const defaultEpisodeTitle = useMemo(() => {
    if (!show) {
      return '';
    }
    return `${show.title} — Episode ${nextEpisodeNumber}`;
  }, [show, nextEpisodeNumber]);

  const nextSlotHint = useMemo(() => {
    const upcoming = bookings
      .filter((b) => new Date(b.startAt).getTime() > Date.now())
      .sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      )[0];
    if (!upcoming) {
      return null;
    }
    return upcoming;
  }, [bookings]);

  /** Uploads a picked image and returns its stored URL. A picked file is only
   * a local blob: preview until this runs, so it must never be saved as the
   * show's URL directly. */
  const uploadPicked = async (file: File | null, current: string) => {
    if (!file) {
      return current;
    }
    const result = await uploadUserMediaFile(file);
    if (!result.ok) {
      throw new Error(result.error);
    }
    return result.data.url;
  };

  const saveMeta = async () => {
    if (!show) {
      return;
    }
    setSavingMeta(true);
    try {
      const [coverUrl, backdrop] = await Promise.all([
        uploadPicked(thumbnailFile, thumbnailUrl.trim()),
        uploadPicked(backdropFile, backdropUrl.trim()),
      ]);
      const r = await patchShowSeries(show.id, {
        title: title.trim() || show.title,
        description: description.trim(),
        coverUrl: coverUrl || null,
        backdropUrl: backdrop || null,
        autoPublish,
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setShow(r.data);
      setThumbnailUrl(r.data.coverUrl ?? '');
      setBackdropUrl(r.data.backdropUrl ?? '');
      setThumbnailFile(null);
      setBackdropFile(null);
      toast.success('Show details saved — new episodes will inherit these.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save the show.',
      );
    } finally {
      setSavingMeta(false);
    }
  };

  const bookNextInterval = async () => {
    if (!show) {
      return;
    }
    setBusy(true);
    setMsg(null);
    const start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 24);
    const end = new Date(start);
    end.setHours(end.getHours() + show.intervalHours);
    const r = await createShowBooking({
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      note: show.title,
      showType: show.showType,
    });
    setBusy(false);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    const episode = await createEpisode({
      showId: show.id,
      source: 'broadcast',
      slotStartAt: r.data.startAt,
      slotEndAt: r.data.endAt,
      bookingId: r.data.id,
    });
    if (!episode.ok) {
      setMsg(`Slot booked, but episode setup failed: ${episode.error}`);
      reload();
      return;
    }
    void navigate({
      to: '/studio/shows/episodes/$episodeId',
      params: { episodeId: episode.data.id },
    });
  };

  const createNewEpisode = async () => {
    if (!show) {
      return;
    }
    if (source === 'upload' && !file) {
      toast.error('Choose an audio file to upload.');
      return;
    }
    setBusy(true);
    setMsg(null);
    let soundId: string | null = null;
    try {
      if (source === 'upload' && file) {
        const up = await uploadSoundFile({ file, title: defaultEpisodeTitle });
        if (!up.ok) {
          toast.error(up.error);
          return;
        }
        soundId = up.itemId;
      }

      // Only a recorded episode takes the upcoming booking; an uploaded one
      // is not tied to a broadcast slot.
      const slot = source === 'broadcast' ? nextSlotHint : null;
      const ep = await createEpisode({
        showId: show.id,
        source,
        soundId,
        slotStartAt: slot?.startAt ?? null,
        slotEndAt: slot?.endAt ?? null,
        bookingId: slot?.id ?? null,
      });
      if (!ep.ok) {
        toast.error(
          soundId
            ? `${ep.error} The audio was uploaded to your library; add it to an episode later.`
            : ep.error,
        );
        return;
      }
      setCreateOpen(false);
      setFile(null);
      void navigate({
        to: '/studio/shows/episodes/$episodeId',
        params: { episodeId: ep.data.id },
      });
    } catch {
      toast.error('Could not create the episode.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <StudioGate>
      <div className="studio-page-layout flex w-full flex-col gap-6 px-1 py-2">
        <Tooltip content="Back to Shows" side="right">
          <Link
            to="/studio/shows"
            aria-label="Back to Shows"
            className="text-foreground-secondary hover:bg-background-secondary -mt-2 inline-flex size-8 w-fit items-center justify-center rounded-full"
          >
            <ArrowLeftIcon size={16} aria-hidden />
          </Link>
        </Tooltip>

        {!show ? (
          <StudioPanel>
            {loaded ? (
              <PageEmpty title="Show not found" />
            ) : (
              <PageLoading label="Loading…" />
            )}
          </StudioPanel>
        ) : (
          <>
            <EntitySocialHeader
              title={show.title}
              imageUrl={thumbnailUrl}
              imageAlt=""
              backdropUrl={backdropUrl}
              subtitle={`${show.showType === 'LIVE_SET' ? 'Live set' : 'Talk show'} · ${show.mode === 'SINGLE' ? 'Single show' : 'Series'}`}
              description={description.trim() || undefined}
              actions={
                show.mode === 'SINGLE' ? undefined : (
                  <Tooltip content="New episode" side="top">
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      className="bg-background border-border rounded-md border-(length:--border-width)"
                      onClick={() => setCreateOpen(true)}
                      aria-label="New episode"
                    >
                      <PlusIcon size={16} aria-hidden />
                    </Button>
                  </Tooltip>
                )
              }
              data-testid="studio-show-social-header"
            />

            <Tabs.Root
              selectedIndex={
                showTab === 'episodes' ? 1 : showTab === 'recordings' ? 2 : 0
              }
              onChange={(index) => {
                setShowTab(
                  index === 1
                    ? 'episodes'
                    : index === 2
                      ? 'recordings'
                      : 'overview',
                );
              }}
            >
              <Tabs.List aria-label="Show sections">
                <Tabs.Tab>
                  <TabLabel icon={<InfoIcon size={14} />}>Overview</TabLabel>
                </Tabs.Tab>
                <Tabs.Tab>
                  <TabLabel
                    icon={<ListMusicIcon size={14} />}
                    count={episodes.length}
                  >
                    Episodes
                  </TabLabel>
                </Tabs.Tab>
                <Tabs.Tab>
                  <TabLabel
                    icon={<CircleDotIcon size={14} />}
                    count={recordingCount}
                  >
                    Recordings
                  </TabLabel>
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.Root>

            {showTab === 'overview' ? (
              <>
                <StudioPanel
                  title="Show defaults"
                  description="Manage the show identity and defaults inherited by new episodes."
                >
                  <div className="flex flex-col gap-3">
                    <Input
                      label="Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
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
                      />
                    </label>
                    <ShowImagePicker
                      label="Show thumbnail"
                      description="JPEG, PNG, WebP, or GIF"
                      value={thumbnailUrl}
                      file={thumbnailFile}
                      onFile={(file) => {
                        revokeBlobUrl(thumbnailUrl);
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
                        revokeBlobUrl(backdropUrl);
                        setBackdropFile(file);
                        setBackdropUrl(file ? URL.createObjectURL(file) : '');
                      }}
                      onUrlChange={setBackdropUrl}
                    />
                    <div className="border-border bg-background-secondary/30 flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
                      <span>
                        <span className="block font-medium">
                          Publish recordings automatically
                        </span>
                        <span className="text-foreground-secondary block text-xs">
                          Recorded broadcasts of this show are published without
                          a manual approval step.
                        </span>
                      </span>
                      <Toggle
                        label="Publish recordings automatically"
                        checked={autoPublish}
                        onChange={setAutoPublish}
                      />
                    </div>
                    <div className="flex justify-end">
                      <SaveButton
                        saving={savingMeta}
                        label="Save defaults"
                        onClick={() => void saveMeta()}
                      />
                    </div>
                  </div>
                </StudioPanel>

                <StudioPanel
                  title="Schedule"
                  action={
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void bookNextInterval()}
                    >
                      <CalendarPlusIcon
                        size={14}
                        aria-hidden
                        className="mr-1.5"
                      />
                      Book next {show.intervalHours}h slot
                    </Button>
                  }
                >
                  {nextSlotHint ? (
                    <p className="text-sm">
                      Next slot:{' '}
                      <strong>
                        {new Date(nextSlotHint.startAt).toLocaleString()}
                      </strong>
                    </p>
                  ) : (
                    <p className="text-foreground-secondary text-sm">
                      No upcoming slots — book an interval for this show.
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link to="/studio/go-live">
                      <Button size="sm" variant="text">
                        <MicIcon size={14} aria-hidden className="mr-1" />
                        Stream live
                      </Button>
                    </Link>
                  </div>
                </StudioPanel>

                {show.mode !== 'SINGLE' ? (
                  <StudioPanel title="Episodes">
                    {episodes.length === 0 ? (
                      <p className="text-foreground-secondary text-sm">
                        No episodes yet. Create one — episode #
                        {nextEpisodeNumber} is ready.
                      </p>
                    ) : (
                      <ul className="divide-border divide-y">
                        {episodes.map((ep) => (
                          <li
                            key={ep.id}
                            className="flex flex-wrap items-center gap-2 py-3 text-sm first:pt-0 last:pb-0"
                          >
                            <span className="text-foreground-secondary w-10 text-xs tabular-nums">
                              #{ep.episodeNumber}
                            </span>
                            <div className="min-w-0 flex-1">
                              <Link
                                to="/studio/shows/episodes/$episodeId"
                                params={{ episodeId: ep.id }}
                                className="font-medium hover:underline"
                              >
                                {ep.title}
                              </Link>
                              <p className="text-foreground-secondary inline-flex items-center gap-1 text-xs">
                                <EpisodeSourceIcon source={ep.source} />
                                {episodeStatusLabel(ep)}
                                {ep.source === 'broadcast'
                                  ? ', recorded'
                                  : ', upload'}
                              </p>
                            </div>
                            <Link
                              to="/studio/shows/episodes/$episodeId"
                              params={{ episodeId: ep.id }}
                            >
                              <Button size="sm" variant="secondary">
                                {ep.status === 'PENDING_APPROVAL'
                                  ? 'Review'
                                  : 'Open'}
                              </Button>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </StudioPanel>
                ) : null}
              </>
            ) : showTab === 'episodes' ? (
              <StudioPanel
                title="All episodes"
                description="Edit every episode and review its publishing and listening metadata."
              >
                {episodes.length === 0 ? (
                  <p className="text-foreground-secondary text-sm">
                    No episodes have been created for this show yet.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {episodes.map((episode) => (
                      <EpisodeEditorRow
                        key={episode.id}
                        episode={episode}
                        onSaved={(updated) =>
                          setEpisodes((current) =>
                            current.map((item) =>
                              item.id === updated.id ? updated : item,
                            ),
                          )
                        }
                      />
                    ))}
                  </ul>
                )}
              </StudioPanel>
            ) : (
              <StudioPanel
                title="Recordings from this show"
                description="Broadcast recordings linked to this show series."
              >
                {episodes.filter((episode) => episode.source === 'broadcast')
                  .length === 0 ? (
                  <p className="text-foreground-secondary text-sm">
                    No recordings from this show yet.
                  </p>
                ) : (
                  <ul className="divide-border divide-y">
                    {episodes
                      .filter((episode) => episode.source === 'broadcast')
                      .map((episode) => (
                        <li
                          key={episode.id}
                          className="flex flex-wrap items-center gap-2 py-3 text-sm first:pt-0 last:pb-0"
                        >
                          <span className="text-foreground-secondary w-10 text-xs">
                            #{episode.episodeNumber}
                          </span>
                          <div className="min-w-0 flex-1">
                            <Link
                              to="/studio/shows/episodes/$episodeId"
                              params={{ episodeId: episode.id }}
                              className="font-medium hover:underline"
                            >
                              {episode.title}
                            </Link>
                            <p className="text-foreground-secondary text-xs">
                              {episode.slotStartAt
                                ? new Date(episode.slotStartAt).toLocaleString()
                                : 'Recorded episode'}{' '}
                              · {episode.status}
                            </p>
                          </div>
                          {episode.soundId ? (
                            <Link
                              to="/studio/sounds/$id"
                              params={{ id: episode.soundId }}
                            >
                              <Button size="sm" variant="secondary">
                                <PlayIcon
                                  size={14}
                                  aria-hidden
                                  className="mr-1.5"
                                />
                                Play recording
                              </Button>
                            </Link>
                          ) : null}
                        </li>
                      ))}
                  </ul>
                )}
              </StudioPanel>
            )}

            <Dialog.Root
              isOpen={createOpen}
              onClose={() => setCreateOpen(false)}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void createNewEpisode();
                }}
              >
                <Dialog.Title>New episode</Dialog.Title>
                <Dialog.Description>
                  Prefills from the show — you only need audio.
                </Dialog.Description>
                <div className="mt-4 flex flex-col gap-3">
                  <div className="border-border bg-background-secondary rounded-lg border px-3 py-2 text-sm">
                    <p>
                      <span className="text-foreground-secondary text-xs uppercase">
                        Episode number
                      </span>
                      <br />
                      <strong className="font-display text-2xl">
                        #{nextEpisodeNumber}
                      </strong>
                    </p>
                    <p className="text-foreground-secondary mt-2 text-xs">
                      Title: {defaultEpisodeTitle}
                    </p>
                    {show.description ? (
                      <p className="text-foreground-secondary mt-1 line-clamp-2 text-xs">
                        Description: {show.description}
                      </p>
                    ) : null}
                    {nextSlotHint ? (
                      <p className="text-foreground-secondary mt-1 text-xs">
                        Schedule:{' '}
                        {new Date(nextSlotHint.startAt).toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-foreground-secondary mt-1 text-xs">
                        Schedule: book a slot after create if needed
                      </p>
                    )}
                  </div>

                  <FilterChips
                    items={[
                      {
                        id: 'upload',
                        label: 'Upload audio',
                        icon: <UploadIcon size={14} aria-hidden />,
                      },
                      {
                        id: 'broadcast',
                        label: 'Record from broadcast',
                        icon: <MicIcon size={14} aria-hidden />,
                      },
                    ]}
                    selected={source}
                    onChange={(id) => setSource(id as 'upload' | 'broadcast')}
                    aria-label="Episode source"
                  />

                  {source === 'upload' ? (
                    <FilePicker
                      labels={{
                        title: 'Episode audio',
                        description: 'MP3, WAV, FLAC, or AIFF',
                        browse: file ? 'Choose another file' : 'Choose audio',
                      }}
                      accept="audio/*,.flac,.wav,.mp3,.aiff"
                      selectedFiles={file ? [file] : []}
                      onFiles={(files) => setFile(files[0] ?? null)}
                    />
                  ) : (
                    <p className="text-foreground-secondary text-sm">
                      Creates a pending episode. Go Live to capture, then
                      review, trim/normalize, and approve before it can air.
                    </p>
                  )}
                </div>
                <Dialog.Actions>
                  <Dialog.Close>Cancel</Dialog.Close>
                  <Button
                    type="submit"
                    disabled={busy || (source === 'upload' && !file)}
                  >
                    {busy
                      ? 'Creating…'
                      : source === 'broadcast'
                        ? 'Create & go record'
                        : 'Create episode'}
                  </Button>
                </Dialog.Actions>
              </form>
            </Dialog.Root>

            {msg && <p className="text-sm">{msg}</p>}
          </>
        )}
      </div>
    </StudioGate>
  );
}
