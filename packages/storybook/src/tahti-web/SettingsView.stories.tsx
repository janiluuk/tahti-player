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
          '`/settings` and `/settings/:section` have no page of their own: they open the settings modal on that section (Account by default), land on an Artist or Account sub-tab from `?tab=`, and turn `?status=` / `?social=` from an OAuth connect into a toast. Signed out, the modal falls back to Themes.',
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
    await expectSelectedTab(dialog, 'Sign-in & security');
    await expectVisible(dialog.getByText('@northern-lights'));
  },
};

export const ArtistStoryTab: Story = {
  args: { sectionId: 'artist' },
  decorators: [withTahtiRouter('/settings/artist?tab=story')],
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement);
    await expectSection(dialog, 'Artist');
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
    await expectSection(dialog, 'Integrations');
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
