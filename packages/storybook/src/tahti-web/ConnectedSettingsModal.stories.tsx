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

export const ArtistTab: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist), withOpenSettings('artist')],
};

export const ChannelDesignTab: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist), withOpenSettings('channel')],
};

export const ThemesTab: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener), withOpenSettings('themes')],
};

export const LanguageTab: Story = {
  name: 'Playback & language, Language tab',
  decorators: [withMockAuth(null), withOpenSettings('playback', 'language')],
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByRole('tab', { name: 'Language', selected: true }),
    ).toBeVisible();
    await expect(body.getByTestId('language-panel')).toBeVisible();
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
