import { QueueHeaderActions } from '@tahti-player/ui';

import { useLayoutStore } from '../stores/layoutStore';
import { usePlayerStore } from '../stores/playerStore';
import { useRightRailOverrideStore } from '../stores/rightRailOverrideStore';
import { useQueueBarActions } from './useQueueBarActions';

/**
 * Nuclear-style queue bar header: full-screen player, clear, and the queue
 * menu. Chat and notifications are top-bar controls, not rail views
 * (docs/DECISIONS.md).
 */
export function RightRailHeaderActions() {
  const railOverride = useRightRailOverrideStore((s) => s.override);
  const { queueLength, requestClear, menuItems, dialogs } =
    useQueueBarActions();
  const setFullScreenPlayerOpen = useLayoutStore(
    (s) => s.setFullScreenPlayerOpen,
  );
  const hasPlayable = usePlayerStore((s) => s.currentId != null);

  if (railOverride) {
    return null;
  }

  return (
    <>
      <QueueHeaderActions
        onOpenFullScreen={() => setFullScreenPlayerOpen(true)}
        fullScreenDisabled={!hasPlayable}
        onClearQueue={requestClear}
        clearDisabled={queueLength === 0}
        menuItems={menuItems}
      />
      {dialogs}
    </>
  );
}
