import { ListMusicIcon } from 'lucide-react';

import { Button, QueuePanel, Tooltip } from '@tahti-player/ui';

import { useLayoutStore } from '../stores/layoutStore';
import { usePlayerStore } from '../stores/playerStore';
import { useRightRailOverrideStore } from '../stores/rightRailOverrideStore';
import { SidebarQueuePanel } from './SidebarQueuePanel';

const COLLAPSED_LABELS = {
  removeButton: 'Remove from queue',
  playbackError: 'Could not play',
};

export function RightRailPanel({ isCollapsed }: { isCollapsed: boolean }) {
  const railOverride = useRightRailOverrideStore((s) => s.override);
  const toggleRight = useLayoutStore((s) => s.toggleRight);

  if (isCollapsed) {
    if (railOverride) {
      return (
        <Tooltip content={`Open ${railOverride.title}`} side="left">
          <Button
            size="icon-sm"
            variant="text"
            className="mx-auto"
            aria-label={`Open ${railOverride.title}`}
            onClick={() => toggleRight()}
          >
            <ListMusicIcon size={18} aria-hidden />
          </Button>
        </Tooltip>
      );
    }
    return <CollapsedQueueBar />;
  }

  if (railOverride) {
    return (
      <div
        className="flex h-full min-h-0 flex-col"
        data-testid="right-rail"
        data-right-rail-override={railOverride.title}
      >
        <div className="border-border shrink-0 border-b px-2 py-2">
          <p className="text-xs font-bold tracking-wide uppercase">
            {railOverride.title}
          </p>
        </div>
        <div className="tahti-hide-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
          {railOverride.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      data-testid="right-rail"
      data-right-rail-view="queue"
    >
      <SidebarQueuePanel toolbar={false} />
    </div>
  );
}

/**
 * Nuclear's collapsed rail: queue artwork only. Chat and notifications live
 * in the top bar, never in the rail (docs/DECISIONS.md, 2026-09-28).
 */
function CollapsedQueueBar() {
  const queue = usePlayerStore((s) => s.queue);
  const currentId = usePlayerStore((s) => s.currentId);
  const playQueueIndex = usePlayerStore((s) => s.playQueueIndex);
  const toggleRight = useLayoutStore((s) => s.toggleRight);

  return (
    <div
      className="flex h-full min-h-0 flex-col items-center"
      data-testid="right-rail"
      data-right-rail-collapsed
    >
      <div className="min-h-0 w-full flex-1">
        {queue.length > 0 ? (
          <QueuePanel
            items={queue}
            currentItemId={currentId ?? undefined}
            isCollapsed
            reorderable={false}
            onSelectItem={playQueueIndex}
            labels={COLLAPSED_LABELS}
          />
        ) : (
          <Tooltip content="Open queue" side="left">
            <Button
              size="icon-sm"
              variant="text"
              className="text-foreground-secondary mx-auto flex"
              aria-label="Open queue"
              onClick={() => toggleRight()}
            >
              <ListMusicIcon size={18} aria-hidden />
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
