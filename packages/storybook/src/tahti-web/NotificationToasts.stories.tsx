import type { Meta, StoryObj } from '@storybook/react-vite';
import { NotificationToasts } from '@tahti-web/components/NotificationToasts';

import {
  Button,
  showNotificationToast,
  toast,
  Toaster,
} from '@tahti-player/ui';

import { withMockAuth } from './_lib/decorators';

/**
 * `NotificationToasts` itself renders nothing — while a user is signed in
 * it starts `notificationInboxStore`'s 20s poll of `/api/me/notifications`
 * and surfaces new/unread entries via the shared `Toaster` using
 * `showNotificationToast` (sticky ones stay until Acknowledge; dismissing
 * only hides the toast, the notifications list keeps the item). It's
 * mounted below alongside `Toaster` and buttons that fire the same
 * `showNotificationToast` helper the real inbox poll uses, since polling
 * itself can't be driven from a story.
 */
const meta: Meta<typeof NotificationToasts> = {
  title: 'Tahti/Misc/NotificationToasts',
  component: NotificationToasts,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const StickyAndOrdinary: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <NotificationToasts />
      <Toaster richColors />
      <p className="text-foreground-secondary max-w-sm text-sm">
        Ordinary toasts fade. Sticky toasts stay until you acknowledge them,
        matching the notifications list.
      </p>
      <div className="flex gap-2">
        <Button
          onClick={() =>
            showNotificationToast('New fan', {
              description:
                'Midnight Cartography started following your channel.',
            })
          }
        >
          Ordinary
        </Button>
        <Button
          onClick={() =>
            showNotificationToast('Theme is in review', {
              id: 'story-inbox-sticky',
              description: 'An admin will approve or reject it soon.',
              sticky: true,
              actionLabel: 'Acknowledge',
              onAction: () => toast.dismiss('story-inbox-sticky'),
            })
          }
        >
          Sticky
        </Button>
      </div>
    </div>
  ),
};
