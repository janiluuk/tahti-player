import { MessageCircleIcon } from 'lucide-react';

export const TIMELINE_EMOTICONS = ['❤️', '🔥', '😍', '👏', '😭', '😮'];

export function TimelineReactionBar({
  clock,
  commentsEnabled,
  signedIn,
  busy,
  commentOpen,
  onReact,
  onComment,
}: {
  clock: string;
  commentsEnabled: boolean;
  signedIn: boolean;
  busy: boolean;
  commentOpen: boolean;
  onReact: (emoticon: string) => void;
  onComment: () => void;
}) {
  return (
    <div
      className="mt-3 flex flex-wrap items-center gap-2"
      aria-label={`React at ${clock}`}
    >
      <span className="text-xs font-semibold text-white/70 tabular-nums">
        At {clock}
      </span>
      {TIMELINE_EMOTICONS.map((emoticon) => (
        <button
          key={emoticon}
          type="button"
          className="rounded-full bg-black/35 px-2 py-1 text-base transition-transform hover:scale-110 disabled:opacity-50"
          onClick={() => onReact(emoticon)}
          disabled={busy || !commentsEnabled || !signedIn}
          aria-label={`Add ${emoticon} at ${clock}`}
        >
          {emoticon}
        </button>
      ))}
      {commentsEnabled ? (
        <button
          type="button"
          className="rounded-full bg-black/35 p-1.5 text-white/85 transition-transform hover:scale-110"
          onClick={onComment}
          aria-expanded={commentOpen}
          aria-label={`Comment at ${clock}`}
        >
          <MessageCircleIcon size={16} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
