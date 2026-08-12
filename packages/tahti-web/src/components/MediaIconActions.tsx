import { HeartIcon, ListPlusIcon, PlayIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@nuclearplayer/ui';

import { cn } from '../lib/cn';

export type MediaIconAction = {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  active?: boolean;
  /** Visual weight — default is primary for play, text for others. */
  variant?: 'default' | 'secondary' | 'text';
};

type Props = {
  actions: MediaIconAction[];
  /** Shown under the icons (e.g. "Play · Queue · Favorite"). */
  hint?: string;
  className?: string;
};

/** Compact icon controls for play / queue / favorite — labels live in the hint row. */
export function MediaIconActions({ actions, hint, className }: Props) {
  const hintText =
    hint ??
    actions
      .map((a) => a.label)
      .filter(Boolean)
      .join(' · ');

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex flex-wrap items-center gap-1">
        {actions.map((a) => (
          <Button
            key={a.id}
            type="button"
            size="icon-sm"
            variant={a.variant ?? (a.id === 'play' ? 'default' : 'text')}
            disabled={a.disabled}
            title={a.title ?? a.label}
            aria-label={a.label}
            aria-pressed={a.active}
            onClick={a.onClick}
          >
            {a.icon}
          </Button>
        ))}
      </div>
      {hintText ? (
        <p className="text-foreground-secondary px-0.5 text-[10px] leading-tight tracking-wide">
          {hintText}
        </p>
      ) : null}
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
  playLabel?: string;
  queueLabel?: string;
}): MediaIconAction[] {
  const actions: MediaIconAction[] = [
    {
      id: 'play',
      label: opts.playLabel ?? 'Play',
      icon: <PlayIcon size={16} />,
      onClick: opts.onPlay,
      disabled: opts.playDisabled,
    },
    {
      id: 'queue',
      label: opts.queueLabel ?? 'Queue',
      icon: <ListPlusIcon size={16} />,
      onClick: opts.onQueue,
      disabled: opts.queueDisabled,
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
          className={opts.favorited ? 'fill-current' : undefined}
        />
      ),
      onClick: opts.onFavorite,
      active: opts.favorited,
      variant: 'text',
    });
  }
  return actions;
}
