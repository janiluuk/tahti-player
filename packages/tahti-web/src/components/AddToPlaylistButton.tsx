import { ListPlusIcon } from 'lucide-react';
import { useState } from 'react';

import { Button, Tooltip } from '@tahti-player/ui';

import { AddToPlaylistPanel } from './AddToPlaylistPanel';

type Props = {
  soundId: string;
  trackTitle: string;
  size?: 'sm' | 'default' | 'icon-sm' | 'icon';
  variant?: 'secondary' | 'text' | 'default';
  className?: string;
  /** When true, show icon only (default). Pass false for icon + label. */
  iconOnly?: boolean;
};

export function AddToPlaylistButton({
  soundId,
  trackTitle,
  size = 'icon-sm',
  variant = 'text',
  className,
  iconOnly = true,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip
        content="Add to playlist"
        side="top"
        disabled={!iconOnly}
        wrapperClassName="inline-flex"
      >
        <Button
          size={
            iconOnly
              ? size
              : size === 'icon-sm' || size === 'icon'
                ? 'sm'
                : size
          }
          variant={variant}
          className={className}
          onClick={() => setOpen(true)}
          aria-label="Add to playlist"
        >
          <ListPlusIcon size={16} aria-hidden />
          {!iconOnly ? <span className="ml-1.5">Add to playlist</span> : null}
        </Button>
      </Tooltip>
      <AddToPlaylistPanel
        isOpen={open}
        soundId={soundId}
        trackTitle={trackTitle}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
