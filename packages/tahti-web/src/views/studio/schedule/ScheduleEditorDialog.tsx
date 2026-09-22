import { XIcon } from 'lucide-react';

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

  const minimumDate = toLocalParts(new Date().toISOString()).date;

  return (
    <Dialog.Root
      isOpen={editorOpen}
      onClose={() => setEditorOpen(false)}
      className="max-w-2xl"
    >
      <Dialog.Title>Next planned broadcast</Dialog.Title>
      <Dialog.Description>
        This is shown on your public channel so listeners know when to return.
      </Dialog.Description>
      <div className="mt-4 flex flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <Input
            type="date"
            label="Date"
            min={minimumDate}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <Input
            type="time"
            label="Local time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-foreground-secondary text-xs uppercase">
            Quick pick
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
            Next Friday
          </Button>
          {(date || time) && (
            <Tooltip content="Clear planned time" side="top">
              <Button
                size="icon-sm"
                variant="text"
                aria-label="Clear planned time"
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
              Tagline, visibility, recording and numbering are the show&apos;s
              own settings — change them on its show page. They apply here only
              when you create a new show.
            </p>
          ) : null}
          <Input
            label="Show tagline"
            disabled={Boolean(selectedShowId)}
            value={showTagline}
            onChange={(event) => setShowTagline(event.target.value)}
            placeholder="Optional subtitle"
          />
          <Select
            label="Visibility"
            disabled={Boolean(selectedShowId)}
            value={showVisibility}
            onValueChange={(value) =>
              setShowVisibility(value as 'PUBLIC' | 'FAN_ONLY')
            }
            options={[
              { id: 'PUBLIC', label: 'Public' },
              { id: 'FAN_ONLY', label: 'Fans only' },
            ]}
          />
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-foreground-secondary">
              Publish recordings automatically
            </span>
            <Toggle
              label="Publish recordings automatically"
              disabled={Boolean(selectedShowId)}
              checked={autoPublish}
              onChange={setAutoPublish}
            />
          </div>
          {showMode === 'SERIES' ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-foreground-secondary">
                Number episodes automatically
              </span>
              <Toggle
                label="Number episodes automatically"
                disabled={Boolean(selectedShowId)}
                checked={episodeNumberEnabled}
                onChange={setEpisodeNumberEnabled}
              />
            </div>
          ) : null}
          {showMode === 'SERIES' && episodeNumberEnabled ? (
            <Input
              type="number"
              variant="number"
              label="Start episode"
              disabled={Boolean(selectedShowId)}
              min={1}
              value={nextEpisodeNumber}
              onChange={(event) =>
                setNextEpisodeNumber(Math.max(1, Number(event.target.value)))
              }
              className="w-24"
            />
          ) : null}
        </div>

        <div className="border-border flex flex-col gap-2 border-t pt-3">
          <span className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
            Weekly recurrence
          </span>
          <FilterChips
            multiple
            items={FREQUENCY_DAY_ORDER.map((day) => ({
              id: String(day),
              label: `Every ${WEEKDAY_LABELS[day]}`,
            }))}
            selected={frequencyDays.map(String)}
            onChange={(ids) => setFrequencyDays(ids.map(Number))}
            aria-label="Weekly recurrence"
          />
          <p className="text-foreground-secondary text-xs">
            Select days to generate episodes automatically; leave empty for a
            one-off show.
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
              Stop recurring schedule
            </Button>
          ) : null}
          <Select
            id="episode-duration"
            label="Duration: extra minutes"
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
            label="Save weekly schedule"
            onClick={() => void saveRecurringSchedule()}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Venue"
            value={venue}
            onChange={(event) => setVenue(event.target.value)}
            placeholder="Optional venue"
          />
          <Input
            label="Location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="City, country, or online"
          />
          <div className="sm:col-span-2">
            <ImageUploadField
              label="Episode artwork"
              description="JPEG, PNG, WebP, or GIF"
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
              Schedule episode
            </Button>
            <SaveButton
              disabled={loading || !date || !time}
              saving={busy}
              label="Save next broadcast"
              onClick={() => void saveSchedule()}
            />
          </div>
        </div>
      </div>
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
