import { XIcon } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  FilterChips,
  Input,
  SaveButton,
  Select,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import {
  BroadcastDetailsFields,
  type BroadcastDetailsValues,
} from '../../../components/BroadcastDetailsFields';
import { ImageUploadField } from '../../../components/ImageUploadField';
import {
  DEFAULT_BROADCAST_HOUR,
  formatDate,
  formatTime,
  FREQUENCY_DAY_ORDER,
  fromLocalParts,
  MILLISECONDS_PER_DAY,
  nextFriday,
  pad,
  toLocalParts,
  WEEKDAY_LABELS,
} from './schedule-helpers';
import type { ScheduleForm } from './useScheduleForm';

const tomorrow = new Date(Date.now() + MILLISECONDS_PER_DAY);
tomorrow.setHours(DEFAULT_BROADCAST_HOUR, 0, 0, 0);

export function ScheduleEditorDialog({ form }: { form: ScheduleForm }) {
  const { t } = useTranslation('web');
  const {
    editorOpen,
    setEditorOpen,
    date,
    setDate,
    time,
    setTime,
    note,
    shows,
    selectedShowId,
    showDescription,
    showCoverUrl,
    showMode,
    showType,
    durationHours,
    durationMinutes,
    setDurationMinutes,
    frequencyDays,
    setFrequencyDays,
    venue,
    setVenue,
    location,
    setLocation,
    episodeArtworkUrl,
    setEpisodeArtworkUrl,
    showTagline,
    setShowTagline,
    showScheduleNote,
    setShowScheduleNote,
    showVisibility,
    setShowVisibility,
    autoPublish,
    setAutoPublish,
    episodeNumberEnabled,
    setEpisodeNumberEnabled,
    nextEpisodeNumber,
    setNextEpisodeNumber,
    selectShow,
    saveRecurringSchedule,
    stopRecurringSchedule,
    scheduleEpisode,
    saveSchedule,
    setQuickDate,
    onBroadcastFieldsChange,
    busy,
    loading,
  } = form;
  // The typed text, while it is not a valid episode number yet (e.g. empty
  // mid-edit), so clearing the field doesn't snap it back to 1.
  const [episodeDraft, setEpisodeDraft] = useState<string | null>(null);

  const minimumDate = toLocalParts(new Date().toISOString()).date;

  return (
    <Dialog.Root
      isOpen={editorOpen}
      onClose={() => setEditorOpen(false)}
      className="max-w-2xl"
    >
      <Dialog.Title>{t('scheduleEditor.nextPlannedBroadcast')}</Dialog.Title>
      <Dialog.Description>
        {t('scheduleEditor.thisIsShownOnYour')}
      </Dialog.Description>
      <form
        className="mt-4 flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void saveSchedule();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <Input
            type="date"
            label={t('scheduleEditor.date')}
            min={minimumDate}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <Input
            type="time"
            label={t('scheduleEditor.localTime')}
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-foreground-secondary text-xs uppercase">
            {t('scheduleEditor.quickPick')}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setQuickDate(tomorrow)}
          >
            Tomorrow at {pad(DEFAULT_BROADCAST_HOUR)}:00
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setQuickDate(nextFriday())}
          >
            {t('scheduleEditor.nextFriday')}
          </Button>
          {(date || time) && (
            <Tooltip content={t('scheduleEditor.clearPlannedTime')} side="top">
              <Button
                size="icon-sm"
                variant="text"
                aria-label={t('scheduleEditor.clearPlannedTime')}
                onClick={() => {
                  setDate('');
                  setTime('');
                }}
              >
                <XIcon size={15} aria-hidden />
              </Button>
            </Tooltip>
          )}
        </div>

        <BroadcastDetailsFields
          values={
            {
              title: note,
              description: showDescription,
              coverUrl: showCoverUrl,
              mode: showMode,
              showType,
              durationHours,
            } satisfies BroadcastDetailsValues
          }
          shows={shows}
          selectedShowId={selectedShowId}
          episodeNumber={
            shows.find((show) => show.id === selectedShowId)
              ?.nextEpisodeNumber ?? 1
          }
          onShowChange={selectShow}
          onChange={onBroadcastFieldsChange}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {selectedShowId ? (
            <p className="text-foreground-secondary text-xs sm:col-span-2">
              {t('scheduleEditor.taglineAirTimeVisibilityRecording')}
            </p>
          ) : null}
          <Input
            label={t('scheduleEditor.showTagline')}
            disabled={Boolean(selectedShowId)}
            value={showTagline}
            onChange={(event) => setShowTagline(event.target.value)}
            placeholder={t('scheduleEditor.optionalSubtitle')}
          />
          <Input
            label={t('scheduleEditor.whenItAirs')}
            disabled={Boolean(selectedShowId)}
            value={showScheduleNote}
            onChange={(event) => setShowScheduleNote(event.target.value)}
            placeholder="e.g. Fridays 20:00"
          />
          <Select
            label={t('scheduleEditor.visibility')}
            disabled={Boolean(selectedShowId)}
            value={showVisibility}
            onValueChange={(value) =>
              setShowVisibility(value as 'PUBLIC' | 'FAN_ONLY')
            }
            options={[
              { id: 'PUBLIC', label: t('scheduleEditorDialog.public') },
              { id: 'FAN_ONLY', label: t('scheduleEditorDialog.fansOnly') },
            ]}
          />
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-foreground-secondary">
              {t('scheduleEditor.publishRecordingsAutomatically')}
            </span>
            <Toggle
              label={t('scheduleEditor.publishRecordingsAutomatically')}
              disabled={Boolean(selectedShowId)}
              checked={autoPublish}
              onChange={setAutoPublish}
            />
          </div>
          {showMode === 'SERIES' ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-foreground-secondary">
                {t('scheduleEditor.numberEpisodesAutomatically')}
              </span>
              <Toggle
                label={t('scheduleEditor.numberEpisodesAutomatically')}
                disabled={Boolean(selectedShowId)}
                checked={episodeNumberEnabled}
                onChange={setEpisodeNumberEnabled}
              />
            </div>
          ) : null}
          {showMode === 'SERIES' && episodeNumberEnabled ? (
            <Input
              type="number"
              inputMode="numeric"
              variant="number"
              label={t('scheduleEditor.startEpisode')}
              disabled={Boolean(selectedShowId)}
              min={1}
              value={episodeDraft ?? String(nextEpisodeNumber)}
              onChange={(event) => {
                const raw = event.target.value;
                const parsed = Number(raw);
                if (
                  raw.trim() !== '' &&
                  Number.isInteger(parsed) &&
                  parsed >= 1
                ) {
                  setNextEpisodeNumber(parsed);
                  setEpisodeDraft(null);
                } else {
                  setEpisodeDraft(raw);
                }
              }}
              onBlur={() => setEpisodeDraft(null)}
              className="w-24"
            />
          ) : null}
        </div>

        <div className="border-border flex flex-col gap-2 border-t pt-3">
          <span className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
            {t('scheduleEditor.weeklyRecurrence')}
          </span>
          <FilterChips
            multiple
            items={FREQUENCY_DAY_ORDER.map((day) => ({
              id: String(day),
              label: `Every ${WEEKDAY_LABELS[day]}`,
            }))}
            selected={frequencyDays.map(String)}
            onChange={(ids) => setFrequencyDays(ids.map(Number))}
            aria-label={t('scheduleEditor.weeklyRecurrence')}
          />
          <p className="text-foreground-secondary text-xs">
            {t('scheduleEditor.selectDaysToGenerateEpisodes')}
          </p>
          {shows.find((show) => show.id === selectedShowId)
            ?.recurrenceEnabled ? (
            <Button
              size="sm"
              variant="text"
              disabled={busy}
              onClick={() => void stopRecurringSchedule()}
            >
              <XIcon size={14} aria-hidden className="mr-1.5" />
              {t('scheduleEditor.stopRecurringSchedule')}
            </Button>
          ) : null}
          <Select
            id="episode-duration"
            label={t('scheduleEditor.durationExtraMinutes')}
            value={String(durationMinutes)}
            options={[0, 15, 30, 45].map((minutes) => ({
              id: String(minutes),
              label: String(minutes),
            }))}
            onValueChange={(value) => setDurationMinutes(Number(value))}
          />
          <SaveButton
            disabled={
              !selectedShowId || !date || !time || frequencyDays.length === 0
            }
            saving={busy}
            label={t('scheduleEditor.saveWeeklySchedule')}
            onClick={() => void saveRecurringSchedule()}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={t('scheduleEditor.venue')}
            value={venue}
            onChange={(event) => setVenue(event.target.value)}
            placeholder={t('scheduleEditor.optionalVenue')}
          />
          <Input
            autoComplete="off"
            label={t('scheduleEditor.location')}
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder={t('scheduleEditor.cityCountryOrOnline')}
          />
          <div className="sm:col-span-2">
            <ImageUploadField
              label={t('scheduleEditor.episodeArtwork')}
              description={t('scheduleEditor.jpegPngWebpOrGif')}
              value={episodeArtworkUrl}
              onChange={setEpisodeArtworkUrl}
            />
          </div>
        </div>

        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-foreground-secondary text-xs">
            {date && time
              ? `${formatDate(fromLocalParts(date, time)!)} at ${formatTime(fromLocalParts(date, time)!)}`
              : 'No next broadcast selected'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={busy || !selectedShowId || !date || !time}
              onClick={() => void scheduleEpisode()}
            >
              {t('scheduleEditor.scheduleEpisode')}
            </Button>
            <SaveButton
              type="submit"
              disabled={loading || !date || !time}
              saving={busy}
              label={t('scheduleEditor.saveNextBroadcast')}
            />
          </div>
        </div>
      </form>
      <Dialog.Actions>
        <Dialog.Close>{t('scheduleEditor.cancel')}</Dialog.Close>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
