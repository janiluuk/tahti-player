import { Bell, MessageCircle } from 'lucide-react';

import { QueueHeaderActions } from '@tahti-player/ui';

import { useLayoutStore, type RightRailTab } from '../stores/layoutStore';
import { useRightRailOverrideStore } from '../stores/rightRailOverrideStore';
import { useUnreadNotifications } from './RightRailNotificationList';
import { useQueueBarActions } from './useQueueBarActions';

/**
 * Nuclear-style queue bar header. Chat and notifications swap the rail body;
 * pressing the active one returns to the queue.
 */
export function RightRailHeaderActions() {
  const railOverride = useRightRailOverrideStore((s) => s.override);
  const tab = useLayoutStore((s) => s.rightRailTab);
  const setRightRailTab = useLayoutStore((s) => s.setRightRailTab);
  const unread = useUnreadNotifications();
  const { queueLength, requestClear, menuItems, dialogs } =
    useQueueBarActions();

  if (railOverride) {
    return null;
  }

  const toggleView = (view: RightRailTab) =>
    setRightRailTab(tab === view ? 'queue' : view);
  const onQueue = tab === 'queue';

  return (
    <>
      <QueueHeaderActions
        views={[
          {
            id: 'chat',
            label: tab === 'chat' ? 'Back to queue' : 'Open chat',
            icon: <MessageCircle size={18} />,
            isActive: tab === 'chat',
            onClick: () => toggleView('chat'),
          },
          {
            id: 'notifications',
            label:
              tab === 'notifications' ? 'Back to queue' : 'Open notifications',
            icon: <Bell size={18} />,
            count: unread.length,
            isActive: tab === 'notifications',
            onClick: () => toggleView('notifications'),
          },
        ]}
        onClearQueue={onQueue ? requestClear : undefined}
        clearDisabled={queueLength === 0}
        menuItems={onQueue ? menuItems : []}
      />
      {dialogs}
    </>
  );
}
