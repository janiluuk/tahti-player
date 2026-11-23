import type { Meta, StoryObj } from '@storybook/react-vite';
import { AccountPanel } from '@tahti-web/views/settings/panels/AccountPanel';
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
import {
  expectNoDialog,
  expectVisible,
  openDialog,
  selectTab,
} from './_lib/play';

const meta: Meta<typeof AccountPanel> = {
  title: 'Tahti/Settings/AccountPanel',
  component: AccountPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Settings → Account is one tab row: Session (profile card), Membership (with a link to Co-op), Subs & purchases (summary tiles, subscriptions with status pills, purchases), Storage (used vs free donut with tiles) and Privacy & data. Security and Notifications are their own Settings items. Signed out it only offers Log in.',
      },
    },
  },
  beforeEach: resetSettingsModal,
  decorators: [
    withPageSurface(),
    withToaster(),
    withTahtiRouter('/settings/account'),
    withMockAuth(MOCK_USERS.listener),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Session: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('tab', { name: 'Session' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(canvas.getAllByRole('tablist')).toHaveLength(1);
    await expect(canvas.queryByRole('tab', { name: 'Governance' })).toBeNull();
    await expectVisible(canvas.getByText(/@listener-liina/));
    await expectVisible(canvas.getByText('Liina'));
    await expect(
      canvas.getByRole('link', { name: 'Keyboard shortcuts' }),
    ).toHaveAttribute('href', '/help/keyboard-shortcuts');
    await expectVisible(canvas.getByRole('button', { name: 'Log out' }));
  },
};

export const Devices: Story = {
  decorators: [withTahtiRouter('/settings/security?tab=devices')],
  render: () => <SecurityPanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await selectTab(canvas, 'Devices');
    await expectVisible(canvas.getByText(/Each sign-in keeps its own session/));
    await expectVisible(canvas.getByText('This browser'));
    await expectVisible(canvas.getByText('This device'));
    await expectVisible(
      canvas.getByRole('button', { name: 'Sign out everywhere' }),
    );
  },
};

export const SubscriptionsAndPurchases: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await selectTab(canvas, 'Subs & purchases');
    await expectVisible(canvas.getByTestId('account-billing-summary'));
    await expect(
      await canvas.findByRole('link', { name: 'Northern Lights' }),
    ).toHaveAttribute('href', '/u/northern-lights');
    await expectVisible(canvas.getByText(/Supporter · €5\/mo/));
    const confirm = await openDialog(
      canvasElement,
      'Manage',
      'Cancel your Supporter subscription to Northern Lights?',
    );
    await userEvent.click(
      confirm.getByRole('button', { name: 'Keep subscription' }),
    );
    await expectNoDialog(canvasElement);

    await expectVisible(await canvas.findByText('Nightfall Over Helsinki'));
    await expect(
      canvas.getByRole('link', { name: 'Midnight Cartography' }),
    ).toHaveAttribute('href', '/u/midnight-cartography');
    await expect(canvas.getByRole('link', { name: 'Listen' })).toHaveAttribute(
      'href',
      '/t/mock-track-1',
    );
  },
};

export const MembershipLinksToCoop: Story = {
  name: 'Membership links to Co-op',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await selectTab(canvas, 'Membership');
    await expect(
      await canvas.findByRole('link', { name: 'Open Co-op' }),
    ).toHaveAttribute('href', '/governance');
    await expect(
      canvas.queryByRole('tablist', { name: /Governance/ }),
    ).toBeNull();
  },
};

export const NotificationsAndMentions: Story = {
  render: () => <SettingsNotificationsPanel />,
  decorators: [withTahtiRouter('/settings/notifications')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await selectTab(canvas, 'Notifications');
    await expectVisible(
      await canvas.findByRole('link', { name: 'Open visibility settings' }),
    );
    await selectTab(canvas, 'Mentions');
    await expectVisible(
      await canvas.findByRole('switch', { name: 'Let artists mention me' }),
    );
    await expectVisible(
      canvas.getByRole('heading', { name: 'Recent mentions' }),
    );
  },
};

export const RequestDeletion: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await selectTab(canvas, 'Privacy & data');
    await expect(
      canvas.getByRole('link', { name: /Data export/ }),
    ).toHaveAttribute('href', '/tahti-api/api/me/data-export.json');
    const submit = canvas.getByRole('button', { name: 'Submit request' });
    await expect(submit).toBeDisabled();
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Reason for deletion request' }),
      'Moving to a new account.',
    );
    await userEvent.click(submit);
    await waitFor(() =>
      expect(canvas.getByRole('status')).toHaveTextContent(
        'Deletion request submitted (ticket mock-deletion-001).',
      ),
    );
  },
};

export const Storage: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await selectTab(canvas, 'Storage');
    await expectVisible(
      await canvas.findByRole('heading', { name: 'Your storage' }),
    );
    await expectVisible(await canvas.findByTestId('account-storage-donut'));
    await expect(canvas.getAllByText('Used').length).toBeGreaterThan(0);
    await expectVisible(canvas.getByText('Free'));
    await expectVisible(canvas.getByText('Quota'));
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(
      canvas.getByText('Sign in to manage membership and security.'),
    );
    await expectVisible(canvas.getByRole('button', { name: 'Log in' }));
  },
};
