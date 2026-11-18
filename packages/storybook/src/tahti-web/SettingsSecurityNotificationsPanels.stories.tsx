import type { Meta, StoryObj } from '@storybook/react-vite';
import { SecurityPanel } from '@tahti-web/views/settings/panels/SecurityPanel';
import { SettingsNotificationsPanel } from '@tahti-web/views/settings/panels/SettingsNotificationsPanel';
import { expect, within } from 'storybook/test';

import { resetSettingsModal } from './_fixtures/settings';
import { withToaster } from './_fixtures/track-release';
import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { expectVisible, selectTab } from './_lib/play';

const meta: Meta<typeof SecurityPanel> = {
  title: 'Tahti/Settings/SecurityAndNotificationsPanels',
  component: SecurityPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Settings → Security (password & email, devices, two-factor, API tokens) and Settings → Notifications (notifications & visibility, mentions), each one tab row.',
      },
    },
  },
  beforeEach: resetSettingsModal,
  decorators: [
    withPageSurface(),
    withToaster(),
    withMockAuth(MOCK_USERS.listener),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SecurityDevices: Story = {
  decorators: [withTahtiRouter('/settings/security')],
  render: () => <SecurityPanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('tablist')).toHaveLength(1);
    await selectTab(canvas, 'Devices');
    await expectVisible(canvas.getByText(/Each sign-in keeps its own session/));
    await expectVisible(
      canvas.getByRole('button', { name: 'Sign out everywhere' }),
    );
  },
};

export const NotificationsAndMentions: Story = {
  decorators: [withTahtiRouter('/settings/notifications')],
  render: () => <SettingsNotificationsPanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(
      await canvas.findByRole('switch', {
        name: 'Show my followers on my profile',
      }),
    );
    await selectTab(canvas, 'Mentions');
    await expectVisible(
      await canvas.findByRole('switch', { name: 'Let artists mention me' }),
    );
  },
};
