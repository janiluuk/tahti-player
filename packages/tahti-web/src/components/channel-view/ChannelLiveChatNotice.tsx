import { Button } from '@tahti-player/ui';

export function ChannelLiveChatNotice({
  onOpenChat,
}: {
  onOpenChat: () => void;
}) {
  return (
    <div className="border-border bg-background-secondary/50 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
      <div>
        <p className="text-sm font-semibold">Live chat is open</p>
        <p className="text-foreground-secondary text-xs">
          Talk with the artist and other listeners while the show is on air.
          Comments below are for the archive, not the live room.
        </p>
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={onOpenChat}
        aria-label="Open live chat"
      >
        Open live chat
      </Button>
    </div>
  );
}
