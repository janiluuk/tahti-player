import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { ConnectedSettingsModal } from '@tahti-web/components/ConnectedSettingsModal';
import {
  useSettingsModalStore,
  type PlaybackSettingsSection,
} from '@tahti-web/stores/settingsModalStore';
import type { SettingsSectionId } from '@tahti-web/views/settings/settingsNav';
import { expect, userEvent, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

/** Opens the modal (isOpen=true) on a given tab before render — the modal
 * component itself owns the isOpen flag via useSettingsModalStore, so
 * there's no `open` prop to pass directly. */
function withOpenSettings(
  tab?: SettingsSectionId,
  playbackSection?: PlaybackSettingsSection,
): Decorator {
  return (Story) => {
    useSettingsModalStore.setState({
      isOpen: true,
      activeTab: tab ?? 'account',
      playbackSection: playbackSection ?? null,
    });
    return <Story />;
  };
}

const meta: Meta<typeof ConnectedSettingsModal> = {
  title: 'Tahti/Player/ConnectedSettingsModal',
  component: ConnectedSettingsModal,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = {
  decorators: [withMockAuth(null), withOpenSettings('account')],
};

export const SignedInAccount: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener), withOpenSettings('account')],
};

export const ListenerProfileTab: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener), withOpenSettings('artist')],
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByRole('heading', { level: 1, name: 'Profile' }),
    ).toBeVisible();
  },
};

export const ArtistSettingsAreAccountOnly: Story = {
  name: 'Artist: account-only list, profile forms in Studio',
  decorators: [withMockAuth(MOCK_USERS.artist), withOpenSettings('account')],
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await body.findByRole('heading', { level: 1, name: 'Account' });
    for (const name of ['Profile', 'Artist', 'Channel & chat', 'Broadcast']) {
      await expect(body.queryByRole('tab', { name })).toBeNull();
    }
  },
};

export const ThemesTab: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener), withOpenSettings('themes')],
};

export const LanguageInGeneral: Story = {
  name: 'General, language and full-screen player',
  decorators: [withMockAuth(null), withOpenSettings('general')],
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await body.findByRole('heading', { level: 1, name: 'General' });
    await expect(body.getByTestId('language-panel')).toBeVisible();
  },
};

export const PlaybackTabs: Story = {
  name: 'Playback, Integrations tab',
  decorators: [
    withMockAuth(null),
    withOpenSettings('playback', 'integrations'),
  ],
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByRole('tab', { name: 'Integrations', selected: true }),
    ).toBeVisible();
    await expect(body.queryByRole('tab', { name: 'Language' })).toBeNull();
    await userEvent.click(body.getByRole('tab', { name: 'Playback' }));
    await expect(
      body.getByRole('tab', { name: 'Playback', selected: true }),
    ).toBeVisible();
  },
};

export const DeploymentFooter: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener), withOpenSettings('account')],
  parameters: {
    docs: {
      description: {
        story:
          'The account settings footer keeps GitHub, Discord, API docs, and the deployment fingerprint together.',
      },
    },
  },
};
