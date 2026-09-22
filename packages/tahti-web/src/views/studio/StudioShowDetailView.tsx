import { Link } from '@tanstack/react-router';
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

import { EntitySocialHeader } from '../../components/EntitySocialHeader';
import { PageEmpty, PageLoading } from '../../components/PageStates';
import { ShowImagePicker } from '../../components/ShowImagePicker';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { EpisodeEditorRow } from './show-detail/EpisodeEditorRow';
import { useShowDetail } from './show-detail/useShowDetail';
import { EpisodeSourceIcon, episodeStatusLabel } from './StudioShowsView';

/** Picked images are previewed through blob: URLs; free them when replaced. */
function revokeBlobUrl(url: string) {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

export function StudioShowDetailView({ id }: { id: string }) {
  const {
    show,
    episodes,
    setEpisodes,
    msg,
    createOpen,
    setCreateOpen,
    source,
    setSource,
    file,
    setFile,
    busy,
    title,
    setTitle,
    description,
    setDescription,
    thumbnailUrl,
    setThumbnailUrl,
    backdropUrl,
    setBackdropUrl,
    thumbnailFile,
    setThumbnailFile,
    backdropFile,
    setBackdropFile,
    autoPublish,
    setAutoPublish,
    savingMeta,
    loaded,
    showTab,
    setShowTab,
    recordingCount,
    nextEpisodeNumber,
    nextSlotHint,
    defaultEpisodeTitle,
    saveMeta,
    bookNextInterval,
    createNewEpisode,
  } = useShowDetail(id);

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
