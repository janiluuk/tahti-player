import { Link } from '@tanstack/react-router';
import { CalendarPlusIcon, MicIcon, PlusIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
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
import { PageEmpty } from '../../../components/PageStates';
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
  editing,
}: {
  show: StudioShowSeries;
  state: ShowDetailState;
  editing: boolean;
}) {
  const { t } = useTranslation('web');
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

  const bookSlotButton = (
    <Button
      size="sm"
      variant="secondary"
      disabled={busy}
      onClick={() => void bookNextInterval()}
    >
      <CalendarPlusIcon size={14} aria-hidden className="mr-1.5" />
      {t('emptyActions.bookNextSlot', { hours: show.intervalHours })}
    </Button>
  );

  return (
    <>
      {editing ? (
        <StudioPanel
          title={t('showOverview.showDefaults')}
          description={t('showOverview.manageTheShowIdentityAnd')}
        >
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void saveMeta();
            }}
          >
            <Input
              label={t('showOverview.title')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              label={t('showOverview.tagline')}
              description={t('showOverview.shortLineUnderTheShow')}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={200}
            />
            <Textarea
              submitOnModEnter
              label={t('showOverview.description')}
              tone="secondary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <Input
              label={t('showOverview.whenItAirs')}
              description={t('showOverview.shownWithYourUpcomingShows')}
              value={scheduleNote}
              onChange={(e) => setScheduleNote(e.target.value)}
              maxLength={200}
            />
            <ShowImagePicker
              label={t('showOverview.showThumbnail')}
              description={t('showOverview.jpegPngWebpOrGif')}
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
              label={t('showOverview.showBackdrop')}
              description={t('showOverview.wideJpegPngWebpOr')}
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
              label={t('showOverview.visibility')}
              description={t('showOverview.whoCanSeeThisShow')}
              value={visibility}
              onValueChange={(value) =>
                setVisibility(value as 'PUBLIC' | 'FAN_ONLY')
              }
              options={[
                { id: 'PUBLIC', label: t('showOverviewTab.public') },
                { id: 'FAN_ONLY', label: t('showOverviewTab.fansOnly') },
              ]}
            />
            <div className="border-border bg-background-secondary/30 flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
              <span>
                <span className="block font-medium">
                  {t('showOverview.publishRecordingsAutomatically')}
                </span>
                <span className="text-foreground-secondary block text-xs">
                  {t('showOverview.recordedBroadcastsOfThisShow')}
                </span>
              </span>
              <Toggle
                label={t('showOverview.publishRecordingsAutomatically')}
                checked={autoPublish}
                onChange={setAutoPublish}
              />
            </div>
            {show.mode !== 'SINGLE' ? (
              <div className="border-border bg-background-secondary/30 flex flex-col gap-3 rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block font-medium">
                      {t('showOverview.numberEpisodesAutomatically')}
                    </span>
                    <span className="text-foreground-secondary block text-xs">
                      {t('showOverview.newEpisodesGetTheNext')}
                    </span>
                  </span>
                  <Toggle
                    label={t('showOverview.numberEpisodesAutomatically')}
                    checked={episodeNumberEnabled}
                    onChange={setEpisodeNumberEnabled}
                  />
                </div>
                {episodeNumberEnabled ? (
                  <Input
                    type="number"
                    inputMode="numeric"
                    variant="number"
                    label={t('showOverview.nextEpisodeNumber')}
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
                label={t('showOverview.saveDefaults')}
                type="submit"
              />
            </div>
          </form>
        </StudioPanel>
      ) : null}

      <StudioPanel
        title={t('showOverview.schedule')}
        action={nextSlotHint ? bookSlotButton : undefined}
      >
        {nextSlotHint ? (
          <p className="text-sm">
            Next slot:{' '}
            <strong>{new Date(nextSlotHint.startAt).toLocaleString()}</strong>
          </p>
        ) : (
          <PageEmpty
            title={t('empties.noUpcomingSlots')}
            description={t('empties.bookAnIntervalForThisShow')}
            action={bookSlotButton}
          />
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <ButtonLink to="/studio/go-live" size="sm" variant="text">
            <MicIcon size={14} aria-hidden className="mr-1" />
            {t('showOverview.streamLive')}
          </ButtonLink>
        </div>
      </StudioPanel>

      {show.mode !== 'SINGLE' ? (
        <StudioPanel title={t('showOverview.episodes')}>
          {episodes.length === 0 ? (
            <PageEmpty
              title={t('show-detailOverviewTabLabels.noEpisodesYetCreateOne', {
                nextEpisodeNumber,
              })}
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => state.setCreateOpen(true)}
                >
                  <PlusIcon size={16} aria-hidden />
                  {t('emptyActions.newEpisode')}
                </Button>
              }
            />
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
                    aria-label={`${ep.status === 'PENDING_APPROVAL' ? 'Review' : 'Open'} ${ep.title}`}
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
