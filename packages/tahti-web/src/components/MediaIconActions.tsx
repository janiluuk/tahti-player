// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  CheckIcon,
  HeartIcon,
  ListPlusIcon,
  PauseIcon,
  PlayIcon,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { Button, Tooltip } from '@tahti-player/ui';

import { cn } from '../lib/cn';

export type MediaIconAction = {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  active?: boolean;
  /** `active` also disables the button by default (right for a one-shot
   * toggle like "queued"). Set false for actions that must stay clickable
   * while active, like play/pause. */
  disableWhenActive?: boolean;
  /** Visual weight — default is primary for play, text for others. */
  variant?: 'default' | 'secondary' | 'text';
};

type Props = {
  actions: MediaIconAction[];
  className?: string;
};

/** Compact icon controls when no artwork thumbnail is available. */
export function MediaIconActions({ actions, className }: Props) {
  const [flashingId, setFlashingId] = useState<string | null>(null);

  useEffect(() => {
    if (!flashingId) {
      return;
    }
    const timeout = window.setTimeout(() => setFlashingId(null), 700);
    return () => window.clearTimeout(timeout);
  }, [flashingId]);

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {actions.map((a) => (
        <Tooltip key={a.id} content={a.title ?? a.label} side="top">
          <Button
            type="button"
            size="icon-sm"
            variant={a.variant ?? (a.id === 'play' ? 'default' : 'text')}
            disabled={
              a.disabled ||
              (a.active && a.disableWhenActive !== false) ||
              flashingId === a.id
            }
            className={cn(
              (a.active || flashingId === a.id) &&
                'bg-primary/20 text-primary motion-safe:animate-pulse',
            )}
            aria-label={a.label}
            aria-pressed={a.active}
            onClick={() => {
              if (a.id === 'queue') {
                setFlashingId(a.id);
              }
              a.onClick();
            }}
          >
            {a.icon}
          </Button>
        </Tooltip>
      ))}
    </div>
  );
}

export function playQueueFavoriteActions(opts: {
  onPlay: () => void;
  onQueue: () => void;
  onFavorite?: () => void;
  favorited?: boolean;
  playDisabled?: boolean;
  queueDisabled?: boolean;
  queued?: boolean;
  playLabel?: string;
  queueLabel?: string;
  /** True when this exact item is the one loaded (playing or loading) in
   * the player. Rule: any play button for a playable track must reflect
   * this — swaps the icon to Pause and highlights the control instead of
   * always showing a static Play glyph. */
  isPlaying?: boolean;
  /** Called instead of onPlay when isPlaying is true (defaults to onPlay,
   * which restarts rather than pauses — pass this to toggle pause). */
  onTogglePause?: () => void;
}): MediaIconAction[] {
  const actions: MediaIconAction[] = [
    {
      id: 'play',
      label: opts.isPlaying ? 'Pause' : (opts.playLabel ?? 'Play'),
      icon: opts.isPlaying ? (
        <PauseIcon size={16} className="fill-current" />
      ) : (
        <PlayIcon size={16} className="fill-current" />
      ),
      onClick:
        opts.isPlaying && opts.onTogglePause ? opts.onTogglePause : opts.onPlay,
      disabled: opts.playDisabled,
      active: opts.isPlaying,
      disableWhenActive: false,
    },
    {
      id: 'queue',
      label: opts.queued ? 'In queue' : (opts.queueLabel ?? 'Queue'),
      icon: opts.queued ? <CheckIcon size={16} /> : <ListPlusIcon size={16} />,
      onClick: opts.onQueue,
      disabled: opts.queueDisabled || opts.queued,
      active: opts.queued,
      variant: 'text',
    },
  ];
  if (opts.onFavorite) {
    actions.push({
      id: 'favorite',
      label: opts.favorited ? 'Favorited' : 'Favorite',
      icon: (
        <HeartIcon
          size={16}
          className={
            opts.favorited ? 'text-accent-red fill-current' : undefined
          }
        />
      ),
      onClick: opts.onFavorite,
      active: opts.favorited,
      variant: 'text',
    });
  }
  return actions;
}
