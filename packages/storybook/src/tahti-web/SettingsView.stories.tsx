import type { Meta, StoryObj } from '@storybook/react-vite';
import { SettingsView } from '@tahti-web/views/settings/SettingsView';
import { expect, waitFor, within } from 'storybook/test';

import { resetSettingsModal, WithSettingsModal } from './_fixtures/settings';
import { withToaster } from './_fixtures/track-release';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { expectVisible, findDialog, findToast } from './_lib/play';

type Scope = ReturnType<typeof within>;

const meta: Meta<typeof SettingsView> = {
  title: 'Tahti/Settings/SettingsView',
  component: SettingsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '`/settings` and `/settings/:section` have no page of their own: they open the settings modal on that section (Account by default), land on a Profile (listeners) or Account sub-tab from `?tab=`; for an artist `/settings/artist`, and every `/settings/channel` or `/settings/broadcast` link goes to Studio instead, and turn `?status=` / `?social=` from an OAuth connect into a toast. Signed out, the modal falls back to Themes.',
      },
    },
  },
  beforeEach: resetSettingsModal,
  render: (args) => (
    <WithSettingsModal>
      <SettingsView {...args} />
    </WithSettingsModal>
  ),
  decorators: [withToaster(), withMockAuth(MOCK_USERS.artist)],
};

export default meta;
type Story = StoryObj<typeof meta>;

async function expectSection(scope: Scope, name: string) {
  const heading = await scope.findByRole('heading', { level: 1, name });
  await waitFor(() => expect(heading).toBeVisible());
}

async function expectSelectedTab(scope: Scope, name: string) {
  await waitFor(() =>
    expect(scope.getByRole('tab', { name })).toHaveAttribute(
      'aria-selected',
      'true',
    ),
  );
}

export const Account: Story = {
  decorators: [withTahtiRouter('/settings')],
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement);
    await expectSection(dialog, 'Account');
    await expectSelectedTab(dialog, 'Profile & data');
    await expectVisible(dialog.getByText('@northern-lights'));
  },
};

export const ListenerProfileStoryTab: Story = {
  args: { sectionId: 'artist' },
  decorators: [
    withTahtiRouter('/settings/artist?tab=story'),
    withMockAuth(MOCK_USERS.listener),
  ],
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement);
    await expectSection(dialog, 'Profile');
    await expectSelectedTab(dialog, 'Profile');
    await expectSelectedTab(dialog, 'Story');
  },
};

export const AccountSubscriptions: Story = {
  args: { sectionId: 'account' },
  decorators: [withTahtiRouter('/settings/account?tab=subscriptions')],
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement);
    await expectSelectedTab(dialog, 'Membership & billing');
    await expectSelectedTab(dialog, 'Your subs');
  },
};

export const ConnectedCallback: Story = {
  args: { sectionId: 'integrations' },
  decorators: [withTahtiRouter('/settings/integrations?status=connected')],
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement);
    await expectSection(dialog, 'Playback & language');
    await expectSelectedTab(dialog, 'Integrations');
    await findToast(canvasElement, 'Connected.');
  },
};

export const SignedOut: Story = {
  decorators: [withTahtiRouter('/settings'), withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement);
    await expectSection(dialog, 'Themes');
    await expect(dialog.queryByText('Account')).toBeNull();
  },
};
