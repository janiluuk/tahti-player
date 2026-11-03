import {
  ArrowRightIcon,
  AudioLinesIcon,
  DiscIcon,
  HeartIcon,
  PauseIcon,
  PlayIcon,
} from 'lucide-react';
import { type FC, type ReactNode } from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';
import { EditIconButton } from '../EditIconButton/EditIconButton';
import { ImageReveal } from '../ImageReveal';

export type CollectionPlayerTrack = {
  id: string;
  title: string;
  /** Muted line under the title, e.g. the artist. */
  subtitle?: string;
  /** Ready-made duration, e.g. `1:53:03`. */
  durationLabel?: string;
  disabled?: boolean;
};

export type CollectionPlayerProps = {
  title: string;
  coverUrl?: string | null;
  /** Kind shown before the count, e.g. `Set`, `Playlist`, `Album`. */
  kindLabel?: string;
  /** Total tracks in the collection, when more than `tracks` shows. */
  trackCount?: number;
  likeCount?: number;
  tracks: CollectionPlayerTrack[];
  /** The playing track, when it is one of this collection's. */
  currentTrackId?: string | null;
  isPlaying?: boolean;
  onPlayAll: () => void;
  onPlayTrack: (index: number) => void;
  /** Pauses or resumes the current track. */
  onTogglePlayback?: () => void;
  onEdit?: () => void;
  /** "Show all" link or button under the list. */
  renderShowAll?: (label: string, children: ReactNode) => ReactNode;
  labels?: {
    sounds?: (count: number) => string;
    likes?: (count: number) => string;
    play?: string;
    pause?: string;
    edit?: string;
    showAll?: (count: number) => string;
    empty?: string;
  };
  className?: string;
};

const defaultSounds = (count: number) =>
  `${count} ${count === 1 ? 'Sound' : 'Sounds'}`;
const defaultLikes = (count: number) =>
  `${count} ${count === 1 ? 'Like' : 'Likes'}`;
const defaultShowAll = (count: number) => `Show all ${defaultSounds(count)}`;

/** A collection you can play from where it is shown: stacked cover, title,
 * play all, and a numbered track list. Hovering a row turns its number
 * into a play button; the playing row is highlighted. */
export const CollectionPlayer: FC<CollectionPlayerProps> = ({
  title,
  coverUrl,
  kindLabel = 'Set',
  trackCount,
  likeCount,
  tracks,
  currentTrackId,
  isPlaying = false,
  onPlayAll,
  onPlayTrack,
  onTogglePlayback,
  onEdit,
  renderShowAll,
  labels,
  className,
}) => {
  const total = trackCount ?? tracks.length;
  const playingHere =
    currentTrackId != null &&
    tracks.some((track) => track.id === currentTrackId);
  const showPause = playingHere && isPlaying;
  const playLabel = labels?.play ?? `Play ${title}`;
  const pauseLabel = labels?.pause ?? `Pause ${title}`;
  const showAllLabel = (labels?.showAll ?? defaultShowAll)(total);

  return (
    <section
      data-testid="collection-player"
      aria-label={title}
      className={cn('flex min-w-0 flex-col', className)}
    >
      <header className="border-border flex min-w-0 items-center gap-5 border-b pb-5">
        <div className="relative shrink-0 pt-2">
          <span
            aria-hidden
            className="bg-background-tertiary absolute inset-x-3 top-0 h-6 rounded-t-xl opacity-70"
          />
          <ImageReveal
            src={coverUrl ?? undefined}
            alt=""
            className="bg-background-secondary relative size-24 overflow-hidden rounded-xl shadow-lg sm:size-28"
            placeholder={
              <DiscIcon size={32} className="text-foreground opacity-30" />
            }
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="text-foreground truncate text-2xl font-bold">
            {title}
          </h2>
          <p className="text-foreground-secondary flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <DiscIcon size={15} aria-hidden />
              {kindLabel}
            </span>
            <span aria-hidden>•</span>
            <span>{(labels?.sounds ?? defaultSounds)(total)}</span>
            {likeCount != null ? (
              <>
                <span aria-hidden>•</span>
                <span className="inline-flex items-center gap-1.5">
                  <HeartIcon size={15} aria-hidden />
                  {(labels?.likes ?? defaultLikes)(likeCount)}
                </span>
              </>
            ) : null}
          </p>
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              className="size-12 rounded-full"
              aria-label={showPause ? pauseLabel : playLabel}
              disabled={tracks.length === 0}
              data-testid="collection-player-play"
              onClick={() =>
                playingHere && onTogglePlayback
                  ? onTogglePlayback()
                  : onPlayAll()
              }
            >
              {showPause ? (
                <PauseIcon size={22} aria-hidden fill="currentColor" />
              ) : (
                <PlayIcon size={22} aria-hidden fill="currentColor" />
              )}
            </Button>
            {onEdit ? (
              <EditIconButton
                className="size-10 rounded-full"
                label={labels?.edit ?? `Edit ${title}`}
                onClick={onEdit}
              />
            ) : null}
          </div>
        </div>
      </header>
      {tracks.length === 0 ? (
        <p className="text-foreground-secondary py-5 text-sm">
          {labels?.empty ?? 'No sounds in this collection yet.'}
        </p>
      ) : (
        <ol className="flex flex-col py-3" aria-label={`${title} tracks`}>
          {tracks.map((track, index) => {
            const current = track.id === currentTrackId;
            const rowPlaying = current && isPlaying;
            return (
              <li key={track.id}>
                <Button
                  variant="plain"
                  size="flexible"
                  disabled={track.disabled}
                  aria-current={current ? 'true' : undefined}
                  aria-label={
                    rowPlaying ? `Pause ${track.title}` : `Play ${track.title}`
                  }
                  data-testid="collection-player-row"
                  data-current={current || undefined}
                  onClick={() =>
                    current && onTogglePlayback
                      ? onTogglePlayback()
                      : onPlayTrack(index)
                  }
                  className={cn(
                    'group hover:bg-background-secondary flex w-full items-center gap-4 rounded-lg px-2 py-2.5 text-left whitespace-normal',
                    current && 'bg-background-secondary',
                  )}
                >
                  <span className="text-foreground-secondary relative flex w-6 shrink-0 justify-center text-sm tabular-nums">
                    {current ? (
                      <span className="text-primary flex group-hover:hidden">
                        {rowPlaying ? (
                          <AudioLinesIcon size={16} aria-hidden />
                        ) : (
                          <PlayIcon size={16} aria-hidden fill="currentColor" />
                        )}
                      </span>
                    ) : (
                      <span className="group-hover:hidden">{index + 1}</span>
                    )}
                    <span className="text-foreground hidden group-hover:flex">
                      {rowPlaying ? (
                        <PauseIcon size={16} aria-hidden fill="currentColor" />
                      ) : (
                        <PlayIcon size={16} aria-hidden fill="currentColor" />
                      )}
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span
                      className={cn(
                        'truncate text-sm sm:text-base',
                        current
                          ? 'text-foreground font-semibold'
                          : 'text-foreground',
                      )}
                    >
                      {track.title}
                    </span>
                    {track.subtitle ? (
                      <span className="text-foreground-secondary truncate text-xs">
                        {track.subtitle}
                      </span>
                    ) : null}
                  </span>
                  {track.durationLabel ? (
                    <span className="text-foreground-secondary shrink-0 text-sm tabular-nums">
                      {track.durationLabel}
                    </span>
                  ) : null}
                </Button>
              </li>
            );
          })}
        </ol>
      )}
      {renderShowAll && total > tracks.length
        ? renderShowAll(
            showAllLabel,
            <span className="text-foreground flex items-center gap-4 px-2 py-2 text-sm font-bold">
              <ArrowRightIcon
                size={18}
                aria-hidden
                className="text-foreground-secondary w-6"
              />
              {showAllLabel}
            </span>,
          )
        : null}
    </section>
  );
};
