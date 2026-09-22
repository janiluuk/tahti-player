import {
  ChevronDownIcon,
  ChevronRightIcon,
  ListMusicIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  RadioIcon,
  SkipBackIcon,
  SkipForwardIcon,
  SquareIcon,
} from 'lucide-react';

import { Badge, Button, MediaArtwork, Tooltip } from '@tahti-player/ui';

import {
  formatRemaining,
  type StreamManagerState,
} from './useStreamManagerState';

export function PanelHeader({
  state,
  onPlaybackToggle,
}: {
  state: StreamManagerState;
  onPlaybackToggle?: () => void;
}) {
  const {
    rotationPlaying,
    playerState,
    outputLabel,
    canControl,
    signalConnected,
    transportBusy,
    handleTransport,
    rotation,
    durationSec,
    elapsedSinceObserved,
    collections,
    openPlaylistDialog,
    rotationExpanded,
    setRotationExpanded,
    isPlaying,
    ending,
    setConfirmEndOpen,
  } = state;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      <div className="order-1 min-w-0 flex-1">
        <div className="font-display flex items-center gap-2 text-sm font-bold tracking-tight sm:text-base">
          {rotationPlaying ? (
            <ListMusicIcon size={18} className="text-primary" aria-hidden />
          ) : (
            <RadioIcon size={18} className="text-primary" aria-hidden />
          )}
          Stream Manager
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <span
            className="inline-flex items-center gap-1.5"
            role="status"
            aria-label={`Player state: ${playerState}`}
          >
            {playerState === 'Live' ? (
              <Badge variant="dot" color="green" animated />
            ) : playerState === 'Playing' ? (
              <Badge variant="dot" color="yellow" />
            ) : null}
          </span>
          <span className="text-foreground-secondary">{outputLabel}</span>
        </div>
      </div>
      {canControl && !signalConnected && (
        <div
          className="order-3 flex w-full shrink-0 items-center justify-center gap-2 sm:order-2 sm:w-auto"
          role="group"
          aria-label="Rotation controls"
        >
          <Tooltip content="Previous track" side="top">
            <Button
              size="icon-sm"
              variant="secondary"
              disabled={transportBusy !== null}
              onClick={() => void handleTransport('previous')}
              aria-label="Previous track"
            >
              <SkipBackIcon size={14} aria-hidden />
            </Button>
          </Tooltip>
          <Tooltip
            content={rotationPlaying ? 'Stop rotation' : 'Start rotation'}
            side="top"
          >
            <Button
              size="icon-sm"
              variant="secondary"
              intent="danger"
              disabled={transportBusy !== null}
              onClick={() =>
                void handleTransport(rotationPlaying ? 'pause' : 'resume')
              }
              aria-label={rotationPlaying ? 'Stop rotation' : 'Start rotation'}
            >
              {rotationPlaying ? (
                <SquareIcon size={14} aria-hidden className="fill-current" />
              ) : (
                <PlayIcon size={14} aria-hidden />
              )}
            </Button>
          </Tooltip>
          <Tooltip content="Skip track" side="top">
            <Button
              size="icon-sm"
              variant="secondary"
              disabled={transportBusy !== null}
              onClick={() => void handleTransport('skip')}
              aria-label="Skip track"
            >
              <SkipForwardIcon size={14} aria-hidden />
            </Button>
          </Tooltip>
        </div>
      )}
      <div className="order-2 flex min-w-0 flex-1 items-center justify-end gap-2 text-right sm:order-3">
        <div className="min-w-0">
          <p className="text-foreground-secondary text-[10px] font-semibold tracking-wide uppercase">
            Current track
          </p>
          {rotation ? (
            <>
              <p className="mt-0.5 truncate text-sm font-semibold">
                {rotation.artistName}
              </p>
              <p className="text-foreground-secondary truncate text-xs">
                {rotation.title}
                {durationSec != null
                  ? ` · ${formatRemaining(Math.min(elapsedSinceObserved, durationSec))} / ${formatRemaining(durationSec)}`
                  : ''}
              </p>
            </>
          ) : (
            <p className="text-foreground-secondary mt-0.5 text-sm">
              No track playing
            </p>
          )}
        </div>
        {rotation && (
          <MediaArtwork
            size="thumb"
            src={rotation.artworkUrl}
            alt={rotation.title}
            className="shrink-0"
            onPlay={
              canControl
                ? () =>
                    void handleTransport(rotationPlaying ? 'pause' : 'resume')
                : undefined
            }
            isPlaying={rotationPlaying}
            playDisabled={transportBusy !== null}
          />
        )}
      </div>
      <div className="order-4 flex shrink-0 items-center gap-2">
        {canControl && collections.length > 0 && (
          <Tooltip content="Edit playlist" side="top">
            <Button
              size="icon-sm"
              variant="secondary"
              onClick={openPlaylistDialog}
              aria-label="Edit playlist"
            >
              <PencilIcon size={14} aria-hidden />
            </Button>
          </Tooltip>
        )}
        {rotationPlaying && (
          <Tooltip
            content={rotationExpanded ? 'Show less' : 'Show more'}
            side="top"
          >
            <Button
              size="icon-sm"
              variant="secondary"
              onClick={() => setRotationExpanded((v) => !v)}
              aria-label={rotationExpanded ? 'Show less' : 'Show more'}
              aria-expanded={rotationExpanded}
            >
              {rotationExpanded ? (
                <ChevronDownIcon size={15} aria-hidden />
              ) : (
                <ChevronRightIcon size={15} aria-hidden />
              )}
            </Button>
          </Tooltip>
        )}
        {canControl && onPlaybackToggle && (
          <Tooltip
            content={isPlaying ? 'Pause stream' : 'Play stream'}
            side="top"
          >
            <Button
              size="icon-sm"
              variant="secondary"
              onClick={onPlaybackToggle}
              aria-label={isPlaying ? 'Pause stream' : 'Play stream'}
            >
              {isPlaying ? <PauseIcon size={15} /> : <PlayIcon size={15} />}
            </Button>
          </Tooltip>
        )}
        {canControl && signalConnected && (
          <Button
            size="sm"
            variant="text"
            disabled={ending}
            onClick={() => setConfirmEndOpen(true)}
          >
            <SquareIcon size={14} className="mr-1.5 fill-current" aria-hidden />
            {ending ? 'Ending…' : 'End stream'}
          </Button>
        )}
      </div>
    </div>
  );
}
