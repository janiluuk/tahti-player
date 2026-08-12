import { Link } from '@tanstack/react-router';

import { Button } from '@nuclearplayer/ui';

type Props = {
  size?: 'sm' | 'default';
  /** Center actions (e.g. empty state). */
  align?: 'start' | 'center';
};

/** Upload + Sources — entry points for adding tracks to the Music archive. */
export function AddToMusicActions({ size = 'sm', align = 'start' }: Props) {
  return (
    <div
      className={`flex flex-wrap gap-2 ${align === 'center' ? 'justify-center' : ''}`}
    >
      <Link to="/studio/upload">
        <Button size={size}>Upload</Button>
      </Link>
      <Link to="/sources">
        <Button size={size} variant="secondary">
          Sources
        </Button>
      </Link>
    </div>
  );
}
