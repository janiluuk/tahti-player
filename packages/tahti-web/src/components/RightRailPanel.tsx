import { ListMusicIcon, MessageSquareIcon } from 'lucide-react';
import { lazy, Suspense, type ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, cn, QueuePanel, Tooltip } from '@tahti-player/ui';

import { useLayoutStore } from '../stores/layoutStore';
import { usePageCommentsRailStore } from '../stores/pageCommentsRailStore';
import { usePlayerStore } from '../stores/playerStore';
import { useRightRailOverrideStore } from '../stores/rightRailOverrideStore';
import { PageLoading } from './PageStates';
import { SidebarQueuePanel } from './SidebarQueuePanel';

// Admin-only, and it pulls in the whole screen atlas (content/mapScreens), so
// it stays out of the app shell chunk.
const AdminPageCommentsPanel = lazy(() =>
  import('./AdminPageCommentsPanel').then((m) => ({
    default: m.AdminPageCommentsPanel,
  })),
);

const COLLAPSED_LABELS = {
  removeButton: 'Remove from queue',
  playbackError: 'Could not play',
};

function RightRailPanelFade({
  panelKey,
  children,
  className,
}: {
  panelKey: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      key={panelKey}
      className={cn(
        'tahti-rail-panel-enter motion-reduce:animate-none',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function RightRailPanel({ isCollapsed }: { isCollapsed: boolean }) {
  const { t } = useTranslation('web');
  const railOverride = useRightRailOverrideStore((s) => s.override);
  const commentsOpen = usePageCommentsRailStore((s) => s.open);
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
    if (commentsOpen) {
      return (
        <Tooltip content={t('rightRailPanel.openPageComments')} side="left">
          <Button
            size="icon-sm"
            variant="text"
            className="mx-auto"
            aria-label={t('rightRailPanel.openPageComments')}
            onClick={() => toggleRight()}
          >
            <MessageSquareIcon size={18} aria-hidden />
          </Button>
        </Tooltip>
      );
    }
    return <CollapsedQueueBar />;
  }

  if (railOverride) {
    return (
      <RightRailPanelFade
        panelKey={`override-${railOverride.title}`}
        className="flex h-full min-h-0 flex-col"
      >
        <aside
          aria-label={railOverride.title}
          className="flex h-full min-h-0 flex-col"
          data-testid="right-rail"
          data-right-rail-override={railOverride.title}
        >
          <div className="border-border shrink-0 border-b px-2 py-2">
            <p className="text-foreground-secondary text-xs font-bold tracking-wide uppercase">
              {railOverride.title}
            </p>
          </div>
          <div className="tahti-hide-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
            {railOverride.content}
          </div>
        </aside>
      </RightRailPanelFade>
    );
  }

  if (commentsOpen) {
    return (
      <RightRailPanelFade
        panelKey="page-comments"
        className="flex h-full min-h-0 flex-col"
      >
        <aside
          aria-label={t('rightRailPanel.pageComments')}
          className="flex h-full min-h-0 flex-col"
          data-testid="right-rail"
          data-right-rail-view="page-comments"
        >
          <div className="border-border shrink-0 border-b px-2 py-2">
            <p className="text-foreground-secondary text-xs font-bold tracking-wide uppercase">
              {t('rightRailPanel.pageComments')}
            </p>
          </div>
          <div className="tahti-hide-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
            <Suspense fallback={<PageLoading />}>
              <AdminPageCommentsPanel />
            </Suspense>
          </div>
        </aside>
      </RightRailPanelFade>
    );
  }

  return (
    <RightRailPanelFade
      panelKey="queue"
      className="flex h-full min-h-0 flex-col"
    >
      <aside
        aria-label={t('rightRailPanel.queue')}
        className="flex h-full min-h-0 flex-col"
        data-testid="right-rail"
        data-right-rail-view="queue"
      >
        <div className="border-border shrink-0 border-b px-2 py-2">
          <p className="text-foreground-secondary text-xs font-bold tracking-wide uppercase">
            {t('rightRailPanel.queue')}
          </p>
        </div>
        <div className="min-h-0 flex-1">
          <SidebarQueuePanel toolbar={false} />
        </div>
      </aside>
    </RightRailPanelFade>
  );
}

function CollapsedQueueBar() {
  const { t } = useTranslation('web');
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
          <Tooltip content={t('rightRailPanel.openQueue')} side="left">
            <Button
              size="icon-sm"
              variant="text"
              className="text-foreground-secondary mx-auto flex"
              aria-label={t('rightRailPanel.openQueue')}
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
