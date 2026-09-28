import { QueueHeaderActions } from '@tahti-player/ui';

import { useRightRailOverrideStore } from '../stores/rightRailOverrideStore';
import { useQueueBarActions } from './useQueueBarActions';

/**
 * Nuclear-style queue bar header: clear and the queue menu. Chat and
 * notifications are top-bar controls, not rail views (docs/DECISIONS.md).
 */
export function RightRailHeaderActions() {
  const railOverride = useRightRailOverrideStore((s) => s.override);
  const { queueLength, requestClear, menuItems, dialogs } =
    useQueueBarActions();

  if (railOverride) {
    return null;
  }

  return (
    <>
      <QueueHeaderActions
        onClearQueue={requestClear}
        clearDisabled={queueLength === 0}
        menuItems={menuItems}
      />
      {dialogs}
    </>
  );
}
