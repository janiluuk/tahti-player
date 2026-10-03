import { Link } from '@tanstack/react-router';
import { CalendarPlusIcon, MicIcon } from 'lucide-react';

import {
  Button,
  ButtonLink,
  Input,
  SaveButton,
  Select,
  Textarea,
  Toggle,
} from '@tahti-player/ui';

import type { StudioShowSeries } from '../../../api/shows';
import { ShowImagePicker } from '../../../components/ShowImagePicker';
import { StudioPanel } from '../../../components/StudioPanel';
import { EpisodeSourceIcon, episodeStatusLabel } from '../StudioShowsView';
import type { ShowDetailState } from './useShowDetail';

/** Picked images are previewed through blob: URLs; free them when replaced. */
function revokeBlobUrl(url: string) {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

export function OverviewTab({
  show,
  state,
}: {
  show: StudioShowSeries;
  state: ShowDetailState;
}) {
  const {
    title,
    setTitle,
    description,
    setDescription,
    tagline,
    setTagline,
    scheduleNote,
    setScheduleNote,
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
    visibility,
    setVisibility,
    episodeNumberEnabled,
    setEpisodeNumberEnabled,
    nextEpisodeNumberDraft,
    setNextEpisodeNumberDraft,
    savingMeta,
    saveMeta,
    busy,
    nextSlotHint,
    bookNextInterval,
    episodes,
    nextEpisodeNumber,
  } = state;

  return (
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
          <Input
            label="Tagline"
            description="Short line under the show name. New broadcasts start with it."
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            maxLength={200}
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
          <Input
            label="When it airs"
            description="Shown with your upcoming shows, e.g. Fridays 20:00."
            value={scheduleNote}
            onChange={(e) => setScheduleNote(e.target.value)}
            maxLength={200}
          />
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
          <Select
            label="Visibility"
            description="Who can see this show and its episodes."
            value={visibility}
            onValueChange={(value) =>
              setVisibility(value as 'PUBLIC' | 'FAN_ONLY')
            }
            options={[
              { id: 'PUBLIC', label: 'Public' },
              { id: 'FAN_ONLY', label: 'Fans only' },
            ]}
          />
          <div className="border-border bg-background-secondary/30 flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
            <span>
              <span className="block font-medium">
                Publish recordings automatically
              </span>
              <span className="text-foreground-secondary block text-xs">
                Recorded broadcasts of this show are published without a manual
                approval step.
              </span>
            </span>
            <Toggle
              label="Publish recordings automatically"
              checked={autoPublish}
              onChange={setAutoPublish}
            />
          </div>
          {show.mode !== 'SINGLE' ? (
            <div className="border-border bg-background-secondary/30 flex flex-col gap-3 rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span>
                  <span className="block font-medium">
                    Number episodes automatically
                  </span>
                  <span className="text-foreground-secondary block text-xs">
                    New episodes get the next number in their title.
                  </span>
                </span>
                <Toggle
                  label="Number episodes automatically"
                  checked={episodeNumberEnabled}
                  onChange={setEpisodeNumberEnabled}
                />
              </div>
              {episodeNumberEnabled ? (
                <Input
                  type="number"
                  variant="number"
                  label="Next episode number"
                  min={1}
                  value={nextEpisodeNumberDraft}
                  onChange={(e) =>
                    setNextEpisodeNumberDraft(
                      Math.max(1, Math.floor(Number(e.target.value)) || 1),
                    )
                  }
                  className="w-24"
                />
              ) : null}
            </div>
          ) : null}
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
            <CalendarPlusIcon size={14} aria-hidden className="mr-1.5" />
            Book next {show.intervalHours}h slot
          </Button>
        }
      >
        {nextSlotHint ? (
          <p className="text-sm">
            Next slot:{' '}
            <strong>{new Date(nextSlotHint.startAt).toLocaleString()}</strong>
          </p>
        ) : (
          <p className="text-foreground-secondary text-sm">
            No upcoming slots — book an interval for this show.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <ButtonLink to="/studio/go-live" size="sm" variant="text">
            <MicIcon size={14} aria-hidden className="mr-1" />
            Stream live
          </ButtonLink>
        </div>
      </StudioPanel>

      {show.mode !== 'SINGLE' ? (
        <StudioPanel title="Episodes">
          {episodes.length === 0 ? (
            <p className="text-foreground-secondary text-sm">
              No episodes yet. Create one — episode #{nextEpisodeNumber} is
              ready.
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
                      {ep.source === 'broadcast' ? ', recorded' : ', upload'}
                    </p>
                  </div>
                  <ButtonLink
                    to="/studio/shows/episodes/$episodeId"
                    params={{ episodeId: ep.id }}
                    size="sm"
                    variant="secondary"
                  >
                    {ep.status === 'PENDING_APPROVAL' ? 'Review' : 'Open'}
                  </ButtonLink>
                </li>
              ))}
            </ul>
          )}
        </StudioPanel>
      ) : null}
    </>
  );
}
