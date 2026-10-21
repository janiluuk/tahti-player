import {
  InfoIcon,
  PauseIcon,
  PlayIcon,
  PowerIcon,
  SettingsIcon,
} from 'lucide-react';

import { Button, MediaArtwork, SaveButton, Tooltip } from '@tahti-player/ui';

import type { RadioStation as PublicRadioStation } from '../../../api/radio-sources';
import type { RadioStation } from '../../../content/radioStations';
import { RadioStationCover } from '../../RadioStationCover';

export function RadioBrowserStationRow({
  station,
  onPlay,
  isPlaying,
  isSaved,
  onToggleSave,
  onInfo,
}: {
  station: PublicRadioStation;
  onPlay: () => void;
  isPlaying: boolean;
  isSaved: boolean;
  onToggleSave: () => void;
  onInfo?: () => void;
}) {
  return (
    <li className="border-border hover:bg-background-secondary flex items-center gap-2 rounded-md border p-1.5 pr-1">
      <MediaArtwork
        size="thumb"
        src={station.favicon}
        alt=""
        imageReveal={false}
        className="border-border shrink-0 rounded border"
      />
      <Button
        type="button"
        variant="text"
        className="h-auto min-w-0 flex-1 flex-col items-start p-0 text-left"
        onClick={onPlay}
      >
        <span className="w-full truncate text-sm">{station.name}</span>
        <span className="text-foreground-secondary w-full truncate text-xs">
          {station.country ?? station.tags?.[0] ?? 'Unknown'}
        </span>
      </Button>
      <Tooltip
        content={isPlaying ? 'Pause' : `Play ${station.name}`}
        side="top"
      >
        <Button
          size="icon-sm"
          variant={isPlaying ? undefined : 'secondary'}
          aria-label={
            isPlaying ? `Pause ${station.name}` : `Play ${station.name}`
          }
          aria-pressed={isPlaying}
          onClick={onPlay}
        >
          {isPlaying ? (
            <PauseIcon size={14} aria-hidden />
          ) : (
            <PlayIcon size={14} aria-hidden />
          )}
        </Button>
      </Tooltip>
      {onInfo && (
        <Tooltip content={`View ${station.name} details`} side="top">
          <Button
            size="icon-sm"
            variant="secondary"
            aria-label={`View ${station.name} details`}
            onClick={onInfo}
          >
            <InfoIcon size={14} aria-hidden />
          </Button>
        </Tooltip>
      )}
      <SaveButton
        size="sm"
        label={isSaved ? 'Saved' : 'Save'}
        onClick={onToggleSave}
        aria-label={
          isSaved
            ? `Remove ${station.name} from Listen`
            : `Save ${station.name} to Listen`
        }
      />
    </li>
  );
}

export function CuratedFinnishStationRow({
  station,
  enabled,
  onToggleEnable,
  onConfigure,
  onPlay,
  isPlaying,
}: {
  station: RadioStation;
  enabled: boolean;
  onToggleEnable: () => void;
  onConfigure: () => void;
  onPlay: (() => void) | null;
  isPlaying: boolean;
}) {
  const sourceConfigured = Boolean(station.streamUrl);
  return (
    <li className="border-border hover:bg-background-secondary flex items-center gap-2 rounded-md border p-1.5 pr-1">
      <RadioStationCover
        src={station.logoUrl}
        label={station.name}
        stationName={station.name}
        catalogStationId={station.id}
        className="h-9 w-9 shrink-0 overflow-hidden rounded border"
      />
      <div className="flex min-w-0 flex-1 flex-col items-start text-left">
        <span className="w-full truncate text-sm">{station.name}</span>
        <span className="text-foreground-secondary w-full truncate text-xs">
          {station.genre} · {station.bitrateKbps}kbps {station.codec}
          {sourceConfigured ? '' : ' · Needs source'}
        </span>
      </div>
      {onPlay ? (
        <Tooltip content={isPlaying ? 'Pause' : 'Preview'} side="top">
          <Button
            type="button"
            size="icon-sm"
            variant={isPlaying ? undefined : 'secondary'}
            aria-label={
              isPlaying ? `Pause ${station.name}` : `Preview ${station.name}`
            }
            aria-pressed={isPlaying}
            onClick={onPlay}
          >
            {isPlaying ? (
              <PauseIcon size={14} aria-hidden />
            ) : (
              <PlayIcon size={14} aria-hidden />
            )}
          </Button>
        </Tooltip>
      ) : null}
      <Tooltip content="Configure station" side="top">
        <Button
          type="button"
          size="icon-sm"
          variant="secondary"
          aria-label={`Configure ${station.name}`}
          onClick={onConfigure}
        >
          <SettingsIcon size={14} aria-hidden />
        </Button>
      </Tooltip>
      <Tooltip
        content={enabled ? `Disable ${station.name}` : `Enable ${station.name}`}
        side="top"
      >
        <Button
          type="button"
          size="icon-sm"
          variant={enabled ? 'default' : 'secondary'}
          aria-label={
            enabled ? `Disable ${station.name}` : `Enable ${station.name}`
          }
          aria-pressed={enabled}
          onClick={onToggleEnable}
        >
          <PowerIcon size={14} aria-hidden />
        </Button>
      </Tooltip>
    </li>
  );
}
