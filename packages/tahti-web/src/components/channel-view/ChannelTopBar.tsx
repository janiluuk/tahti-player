/** The artist's Channel Designer top bar line, for pages without the hero
 * block (the hero draws the same text inside its backdrop, see
 * ChannelBackdropCard). */
export function ChannelTopBar({ text }: { text: string | null | undefined }) {
  const trimmed = text?.trim();
  if (!trimmed) {
    return null;
  }
  return (
    <div
      data-testid="channel-top-bar"
      className="bg-background-secondary text-foreground border-border truncate rounded-md border-(length:--border-width) px-4 py-1.5 text-center text-xs font-semibold tracking-wide sm:text-sm"
    >
      {trimmed}
    </div>
  );
}
