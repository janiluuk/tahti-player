import type { Meta, StoryObj } from '@storybook/react-vite';
import { SecurityPanel } from '@tahti-web/views/settings/panels/SecurityPanel';
import { SettingsNotificationsPanel } from '@tahti-web/views/settings/panels/SettingsNotificationsPanel';
import { expect, userEvent, waitFor, within } from 'storybook/test';

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
          'Settings → Security (overview with password and email rows that open dialogs, two-factor with a banner while it is off, linked logins; devices; API tokens) and Settings → Notifications (notifications & visibility, mentions), each one tab row.',
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

/** The Security overview: password and email rows with edit buttons that
 * open their forms in dialogs, and a banner recommending two-factor while it
 * is off (mock: off). */
export const SecurityOverview: Story = {
  decorators: [withTahtiRouter('/settings/security')],
  render: () => <SecurityPanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const banner = await canvas.findByTestId(
      'security-2fa-banner',
      {},
      { timeout: 5000 },
    );
    await expect(banner).toHaveTextContent('Add a second lock to your account');
    await expectVisible(canvas.getByRole('heading', { name: 'Sign-in' }));
    await userEvent.click(
      canvas.getByRole('button', { name: 'Change password' }),
    );
    const dialog = within(await body.findByRole('dialog'));
    await userEvent.type(
      dialog.getByLabelText('Current password'),
      'Abc12345678',
    );
    await userEvent.type(dialog.getByLabelText('New password'), 'Abc12345678');
    await expectVisible(
      dialog.getByText('Choose a password different from your current one.'),
    );
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
    await userEvent.click(canvas.getByRole('button', { name: 'Change email' }));
    const emailDialog = within(await body.findByRole('dialog'));
    const field = emailDialog.getByLabelText('New email');
    await userEvent.type(field, 'not-an-email');
    await userEvent.tab();
    await expectVisible(emailDialog.getByText(/Enter a valid email address/));
  },
};

/** Security lists linked Google/Facebook logins; Disconnect asks
 * first, and Facebook offers Link (mock: Google is linked). */
export const LinkedLogins: Story = {
  decorators: [withTahtiRouter('/settings/security')],
  render: () => <SecurityPanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await selectTab(canvas, 'Security');
    await expectVisible(
      await canvas.findByRole('heading', { name: 'Linked logins' }),
    );
    await expectVisible(
      await canvas.findByText('Linked · demo.listener@gmail.com'),
    );
    await expectVisible(
      await canvas.findByRole('button', { name: 'Link Facebook' }),
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Disconnect Google' }),
    );
    const body = within(canvasElement.ownerDocument.body);
    await expectVisible(await body.findByText('Disconnect Google?'));
    await userEvent.click(body.getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(body.queryByText('Disconnect Google?')).toBeNull(),
    );
  },
};

/** An account created with Google/Facebook has no password: the password
 * row offers Set password, which opens the set form in a dialog, and the only
 * linked login carries a hint next to Disconnect. Setting one turns the row
 * into Change password. */
export const NoPasswordAccount: Story = {
  decorators: [
    withTahtiRouter('/settings/security'),
    withMockAuth({ ...MOCK_USERS.listener, hasPassword: false }),
  ],
  render: () => <SecurityPanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await selectTab(canvas, 'Security');
    await expectVisible(
      await canvas.findByText(
        'Set a password first to disconnect your only way to sign in.',
      ),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Set password' }));
    const dialog = within(await body.findByRole('dialog'));
    await expect(dialog.queryByLabelText('Current password')).toBeNull();
    await userEvent.type(
      dialog.getByLabelText('New password'),
      'NewPassword123',
    );
    await userEvent.type(
      dialog.getByLabelText('Confirm new password'),
      'NewPassword123',
    );
    await userEvent.click(dialog.getByRole('button', { name: 'Set password' }));
    await expectVisible(
      await body.findByText(
        'Password set. You can now also sign in with your email.',
      ),
    );
    await userEvent.keyboard('{Escape}');
    await expectVisible(
      await canvas.findByRole('button', { name: 'Change password' }),
    );
    await waitFor(() =>
      expect(
        canvas.queryByText(
          'Set a password first to disconnect your only way to sign in.',
        ),
      ).toBeNull(),
    );
  },
};

export const NotificationsAndMentions: Story = {
  decorators: [withTahtiRouter('/settings/notifications')],
  render: () => <SettingsNotificationsPanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(
      await canvas.findByRole('link', { name: 'Open visibility settings' }),
    );
    await selectTab(canvas, 'Mentions');
    await expectVisible(
      await canvas.findByRole('switch', { name: 'Let artists mention me' }),
    );
  },
};
