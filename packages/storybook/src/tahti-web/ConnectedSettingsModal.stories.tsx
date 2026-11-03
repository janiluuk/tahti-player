import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { ConnectedSettingsModal } from '@tahti-web/components/ConnectedSettingsModal';
import { useSettingsModalStore } from '@tahti-web/stores/settingsModalStore';
import type { SettingsSectionId } from '@tahti-web/views/settings/settingsNav';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

/** Opens the modal (isOpen=true) on a given tab before render — the modal
 * component itself owns the isOpen flag via useSettingsModalStore, so
 * there's no `open` prop to pass directly. */
function withOpenSettings(tab?: SettingsSectionId): Decorator {
  return (Story) => {
    useSettingsModalStore.setState({
      isOpen: true,
      activeTab: tab ?? 'account',
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
  decorators: [withMockAuth(null), withOpenSettings('language')],
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
