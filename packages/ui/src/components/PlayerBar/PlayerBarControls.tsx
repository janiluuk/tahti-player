import {
  BoomBox,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { FC } from 'react';

import { RepeatMode } from '@tahti-player/model';

import { Button } from '..';
import { cn } from '../../utils';
import { Tooltip } from '../Tooltip';

type PlayerBarControlsLabels = {
  shuffleOn?: string;
  shuffleOff?: string;
  repeatOff?: string;
  repeatAll?: string;
  repeatOne?: string;
  discoveryOn?: string;
  discoveryOff?: string;
};

const REPEAT_LABEL_KEY: Record<RepeatMode, keyof PlayerBarControlsLabels> = {
  off: 'repeatOff',
  all: 'repeatAll',
  one: 'repeatOne',
};

type PlayerBarControlsProps = {
  isPlaying?: boolean;
  isShuffleActive?: boolean;
  isDiscoveryActive?: boolean;
  repeatMode?: RepeatMode;
  labels: PlayerBarControlsLabels;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onShuffleToggle: () => void;
  onRepeatToggle: () => void;
  onDiscoveryToggle?: () => void;
  showDiscovery: boolean;
  className?: string;
  /** 'large' bumps button/icon size and swaps flat hover states for a
   * translucent glass chip — for takeover surfaces (full-screen player)
   * where controls sit directly over cover art / a visualizer instead of
   * the opaque player bar. Defaults to the compact player-bar sizing. */
  size?: 'default' | 'large';
};

export const PlayerBarControls: FC<PlayerBarControlsProps> = ({
  isPlaying = false,
  isShuffleActive = false,
  isDiscoveryActive = false,
  repeatMode = 'off',
  labels,
  onPlayPause,
  onNext,
  onPrevious,
  onShuffleToggle,
  onRepeatToggle,
  onDiscoveryToggle,
  showDiscovery,
  className = '',
  size = 'default',
}) => {
  const large = size === 'large';
  const iconSize = large ? 24 : 16;
  const playIconSize = large ? 30 : 16;
  const glass = large
    ? 'bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 active:bg-black/60'
    : 'rounded-full';

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        large ? 'gap-3' : 'gap-1.5',
        className,
      )}
    >
      <Tooltip
        content={isShuffleActive ? labels?.shuffleOn : labels?.shuffleOff}
        side="top"
      >
        <Button
          size="icon"
          variant={isShuffleActive && !large ? 'default' : 'text'}
          className={cn(
            large ? 'size-11 rounded-full' : 'rounded-full',
            glass,
            large && isShuffleActive && 'bg-accent-green/80 text-black',
          )}
          onClick={onShuffleToggle}
          aria-label={isShuffleActive ? labels?.shuffleOn : labels?.shuffleOff}
          aria-pressed={isShuffleActive}
          data-testid="player-shuffle-button"
        >
          <Shuffle size={iconSize} />
        </Button>
      </Tooltip>
      <Tooltip content="Previous" side="top">
        <Button
          size="icon"
          variant="text"
          className={cn(large ? 'size-11 rounded-full' : 'rounded-full', glass)}
          onClick={onPrevious}
          aria-label="Previous"
        >
          <SkipBack size={iconSize} />
        </Button>
      </Tooltip>
      <Tooltip content={isPlaying ? 'Pause' : 'Play'} side="top">
        <Button
          size="icon"
          onClick={onPlayPause}
          className={cn(
            'active:bg-accent-green rounded-full shadow-md active:text-black',
            large ? 'size-16' : 'size-10',
            isPlaying && 'bg-accent-green text-black',
            large && !isPlaying && 'bg-white/90 text-black hover:bg-white',
          )}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          aria-pressed={isPlaying}
          data-testid={isPlaying ? 'player-pause-button' : 'player-play-button'}
        >
          {isPlaying ? (
            <Pause size={playIconSize} />
          ) : (
            <Play size={playIconSize} />
          )}
        </Button>
      </Tooltip>
      <Tooltip content="Next" side="top">
        <Button
          size="icon"
          variant="text"
          className={cn(large ? 'size-11 rounded-full' : 'rounded-full', glass)}
          onClick={onNext}
          aria-label="Next"
          data-testid="player-next-button"
        >
          <SkipForward size={iconSize} />
        </Button>
      </Tooltip>
      <Tooltip content={labels?.[REPEAT_LABEL_KEY[repeatMode]]} side="top">
        <Button
          size="icon"
          variant={repeatMode !== 'off' && !large ? 'default' : 'text'}
          className={cn(
            large ? 'size-11 rounded-full' : 'rounded-full',
            glass,
            large && repeatMode !== 'off' && 'bg-accent-green/80 text-black',
          )}
          onClick={onRepeatToggle}
          aria-label={labels?.[REPEAT_LABEL_KEY[repeatMode]]}
          aria-pressed={repeatMode !== 'off'}
          data-testid="player-repeat-button"
        >
          {repeatMode === 'one' && <Repeat1 size={iconSize} />}
          {repeatMode !== 'one' && <Repeat size={iconSize} />}
        </Button>
      </Tooltip>
      {showDiscovery && (
        <Tooltip
          content={
            isDiscoveryActive ? labels?.discoveryOn : labels?.discoveryOff
          }
          side="top"
        >
          <Button
            size="icon"
            variant={isDiscoveryActive && !large ? 'default' : 'text'}
            className={cn(
              large ? 'size-11 rounded-full' : 'rounded-full',
              glass,
              large && isDiscoveryActive && 'bg-accent-green/80 text-black',
            )}
            onClick={onDiscoveryToggle}
            aria-label={
              isDiscoveryActive ? labels?.discoveryOn : labels?.discoveryOff
            }
            aria-pressed={isDiscoveryActive}
            data-testid="player-discovery-button"
          >
            <BoomBox size={iconSize} />
          </Button>
        </Tooltip>
      )}
    </div>
  );
};
