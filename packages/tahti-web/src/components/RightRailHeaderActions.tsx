import { MessageSquareIcon } from 'lucide-react';

import { QueueHeaderActions } from '@tahti-player/ui';

import { hasAccountRole } from '../lib/accountRoles';
import { useAuthStore } from '../stores/authStore';
import { useLayoutStore } from '../stores/layoutStore';
import { useMapNotesStore } from '../stores/mapNotesStore';
import { usePageCommentsRailStore } from '../stores/pageCommentsRailStore';
import { useRightRailOverrideStore } from '../stores/rightRailOverrideStore';
import { useQueueBarActions } from './useQueueBarActions';

/**
 * Nuclear-style queue bar header: clear and the queue menu. Board members also get page comments (same store as Tahti atlas).
 * Chat and notifications are top-bar controls, not rail views
 * (docs/DECISIONS.md).
 */
export function RightRailHeaderActions() {
  const railOverride = useRightRailOverrideStore((s) => s.override);
  const { queueLength, requestClear, menuItems, dialogs } =
    useQueueBarActions();
  const rightCollapsed = useLayoutStore((s) => s.rightCollapsed);
  const setRightCollapsed = useLayoutStore((s) => s.setRightCollapsed);
  const user = useAuthStore((s) => s.user);
  const isBoard = hasAccountRole(user, 'BOARD');
  const commentsOpen = usePageCommentsRailStore((s) => s.open);
  const toggleComments = usePageCommentsRailStore((s) => s.toggle);
  const openCommentCount = useMapNotesStore(
    (s) => s.comments.filter((c) => !c.resolvedAt).length,
  );

  if (railOverride) {
    return null;
  }

  const views = isBoard
    ? [
        {
          id: 'comments',
          label: 'Page comments',
          icon: <MessageSquareIcon size={16} aria-hidden />,
          count: openCommentCount > 0 ? openCommentCount : undefined,
          isActive: commentsOpen,
          onClick: () => {
            toggleComments();
            if (rightCollapsed) {
              setRightCollapsed(false);
            }
          },
        },
      ]
    : [];

  return (
    <>
      <QueueHeaderActions
        views={views}
        onClearQueue={requestClear}
        clearDisabled={queueLength === 0}
        menuItems={menuItems}
      />
      {dialogs}
    </>
  );
}
