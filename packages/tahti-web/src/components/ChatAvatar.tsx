// Chat is anonymous/handle-based -- there's no avatarUrl to show, so each
// handle gets a deterministic initial-letter avatar instead. Cycling through
// theme accent tokens (not arbitrary hex) keeps it consistent with the rest
// of the app's palette.
const AVATAR_COLORS = [
  'var(--accent-red)',
  'var(--accent-green)',
  'var(--accent-blue)',
  'var(--accent-purple)',
  'var(--accent-cyan)',
  'var(--accent-yellow)',
  'var(--accent-orange)',
  'var(--primary)',
] as const;

function avatarColorFor(handle: string): string {
  let hash = 0;
  for (let i = 0; i < handle.length; i++) {
    hash = (hash * 31 + handle.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!;
}

export function ChatAvatar({ handle }: { handle: string }) {
  return (
    <span
      className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-black/80"
      style={{ background: avatarColorFor(handle) }}
      aria-hidden
    >
      {handle.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}
