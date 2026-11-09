import { HeartIcon, PauseIcon, PlayIcon, RadioTowerIcon } from 'lucide-react';

import { Button, ButtonLink, Tooltip } from '@tahti-player/ui';

/** The radio hero's play/pause: the same round white button as the track
 * page, so the glyph stays visible on any visualizer while playing. */
export function RadioPlayButton({
  playing,
  playLabel,
  pauseLabel,
  onToggle,
}: {
  playing: boolean;
  playLabel: string;
  pauseLabel: string;
  onToggle: () => void;
}) {
  const label = playing ? pauseLabel : playLabel;
  return (
    <Tooltip content={label} side="left">
      <Button
        variant="text"
        onClick={onToggle}
        aria-label={label}
        aria-pressed={playing}
        data-testid="radio-play-button"
        className="size-14 shrink-0 justify-center rounded-full bg-white p-0 text-black shadow-xl hover:bg-white active:bg-white"
      >
        {playing ? (
          <PauseIcon size={22} fill="currentColor" aria-hidden />
        ) : (
          <PlayIcon
            size={22}
            fill="currentColor"
            className="ml-0.5"
            aria-hidden
          />
        )}
      </Button>
    </Tooltip>
  );
}

/** Favourite and open-channel as icon buttons over the visualizer. */
export function RadioStationActions({
  favorited,
  favoriteLabel,
  unfavoriteLabel,
  onToggleFavorite,
  channelSlug,
  openChannelLabel,
}: {
  favorited: boolean;
  favoriteLabel: string;
  unfavoriteLabel: string;
  onToggleFavorite: () => void;
  channelSlug: string;
  openChannelLabel: string;
}) {
  const heartLabel = favorited ? unfavoriteLabel : favoriteLabel;
  return (
    <div className="flex items-center gap-1.5">
      <Tooltip content={heartLabel} side="top">
        <Button
          size="icon-sm"
          variant="secondary"
          className="size-9"
          aria-label={heartLabel}
          aria-pressed={favorited}
          data-testid="radio-favorite-button"
          onClick={onToggleFavorite}
        >
          <HeartIcon
            size={15}
            aria-hidden
            className={
              favorited ? 'fill-accent-red text-accent-red' : undefined
            }
          />
        </Button>
      </Tooltip>
      <Tooltip content={openChannelLabel} side="top">
        <ButtonLink
          to="/channel/$slug"
          params={{ slug: channelSlug }}
          search={{ view: 'channel' }}
          size="icon-sm"
          variant="secondary"
          className="size-9"
          aria-label={openChannelLabel}
        >
          <RadioTowerIcon size={15} aria-hidden />
        </ButtonLink>
      </Tooltip>
    </div>
  );
}
