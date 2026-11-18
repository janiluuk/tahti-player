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

type Scope = ReturnType<typeof within>;

const meta: Meta<typeof AccountPanel> = {
  title: 'Tahti/Settings/AccountPanel',
  component: AccountPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Settings → Account: Profile & data (session, privacy, storage) and Membership & billing (membership, Governance link to Co-op, fan subscriptions, purchases). Password, devices, 2FA and API tokens are under Settings → Security; notifications under Settings → Notifications. Signed out it only offers Log in.',
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

async function openGroup(scope: Scope, group: string, tab: string) {
  await selectTab(scope, group);
  // Group and tab can share a name; the group's panel holds the tab row.
  const panel = scope.getAllByRole('tabpanel')[0]!;
  await selectTab(within(panel), tab);
}

export const Session: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('tab', { name: 'Profile & data' }),
    ).toHaveAttribute('aria-selected', 'true');
    await expectVisible(canvas.getByText('@listener-liina'));
    await expectVisible(canvas.getByText('Liina'));
    await expect(
      canvas.getByRole('link', { name: 'Keyboard shortcuts' }),
    ).toHaveAttribute('href', '/help/keyboard-shortcuts');
    await expectVisible(canvas.getByRole('button', { name: 'Log out' }));
    await expectVisible(canvas.getByRole('tab', { name: 'Session' }));
    await expectVisible(canvas.getByRole('tab', { name: 'Privacy & data' }));
    await expectVisible(canvas.getByRole('tab', { name: 'Storage' }));
  },
};

export const Devices: Story = {
  render: () => <SecurityPanel />,
  decorators: [withTahtiRouter('/settings/security?tab=devices')],
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
    await openGroup(canvas, 'Membership & billing', 'Your subs');
    await expect(
      await canvas.findByRole('link', { name: 'Northern Lights' }),
    ).toHaveAttribute('href', '/u/northern-lights');
    await expectVisible(canvas.getByText(/Supporter, €5\/mo/));
    const confirm = await openDialog(
      canvasElement,
      'Manage',
      'Cancel your Supporter subscription to Northern Lights?',
    );
    await userEvent.click(
      confirm.getByRole('button', { name: 'Keep subscription' }),
    );
    await expectNoDialog(canvasElement);

    await selectTab(canvas, 'Purchases');
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

export const GovernanceLinksToCoop: Story = {
  name: 'Governance links to Co-op',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await openGroup(canvas, 'Membership & billing', 'Governance');
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
    await selectTab(canvas, 'Notifications & visibility');
    await expectVisible(
      await canvas.findByRole('switch', {
        name: 'Show my followers on my profile',
      }),
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

// The deletion request needs a reason and confirms with its ticket id.
export const RequestDeletion: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await openGroup(canvas, 'Profile & data', 'Privacy & data');
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
    await openGroup(canvas, 'Profile & data', 'Storage');
    await expectVisible(
      await canvas.findByRole('heading', { name: 'Your storage' }),
    );
    await expectVisible(canvas.getByText('Used'));
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
