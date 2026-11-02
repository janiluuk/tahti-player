import { MessageCircleIcon, SmilePlusIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@tahti-player/ui';

export const TIMELINE_EMOTICONS = ['❤️', '🔥', '😍', '👏', '😭', '😮'];

export function TimelineReactionBar({
  clock,
  commentsEnabled,
  signedIn,
  busy,
  commentOpen,
  onReact,
  onComment,
  onSignIn,
}: {
  clock: string;
  commentsEnabled: boolean;
  signedIn: boolean;
  busy: boolean;
  commentOpen: boolean;
  onReact: (emoticon: string) => void;
  onComment: () => void;
  /** Called instead of `onReact` for a visitor with no account. */
  onSignIn: () => void;
}) {
  const [open, setOpen] = useState(false);
  const chip =
    'rounded-full bg-black/35 px-2 py-1 text-base transition-transform hover:scale-110 disabled:opacity-50';

  return (
    <div
      className="mt-3 flex flex-wrap items-center gap-2"
      role="group"
      aria-label={`React at ${clock}`}
    >
      <span className="text-xs font-semibold text-white/70 tabular-nums">
        At {clock}
      </span>
      {!signedIn ? (
        <Button
          type="button"
          variant="text"
          size="flexible"
          className={`${chip} gap-1.5 text-sm text-white/85`}
          onClick={onSignIn}
          disabled={!commentsEnabled}
        >
          <SmilePlusIcon size={16} aria-hidden />
          Log in to react
        </Button>
      ) : (
        <Button
          type="button"
          variant="text"
          size="flexible"
          className={`${chip} p-1.5 text-white/85`}
          onClick={() => setOpen((value) => !value)}
          disabled={busy || !commentsEnabled}
          aria-expanded={open}
          aria-label={`React at ${clock}`}
        >
          <SmilePlusIcon size={16} aria-hidden />
        </Button>
      )}
      {signedIn && open
        ? TIMELINE_EMOTICONS.map((emoticon) => (
            <Button
              key={emoticon}
              type="button"
              variant="text"
              size="flexible"
              className={chip}
              onClick={() => {
                onReact(emoticon);
                setOpen(false);
              }}
              disabled={busy || !commentsEnabled}
              aria-label={`Add ${emoticon} at ${clock}`}
            >
              {emoticon}
            </Button>
          ))
        : null}
      {commentsEnabled ? (
        <Button
          type="button"
          variant="text"
          size="flexible"
          className="rounded-full bg-black/35 p-1.5 text-white/85 transition-transform hover:scale-110"
          onClick={onComment}
          aria-expanded={commentOpen}
          aria-label={`Comment at ${clock}`}
        >
          <MessageCircleIcon size={16} aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
