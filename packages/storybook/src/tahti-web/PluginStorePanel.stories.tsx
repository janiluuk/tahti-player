import type { Meta, StoryObj } from '@storybook/react-vite';
import { PluginStorePanel } from '@tahti-web/components/PluginStorePanel';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof PluginStorePanel> = {
  title: 'Tahti/Widgets/PluginStorePanel',
  component: PluginStorePanel,
  parameters: { layout: 'padded' },
  decorators: [withTahtiRouter('/settings/plugin-store')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Listener: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
};

export const Artist: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
};

export const Admin: Story = {
  decorators: [withMockAuth(MOCK_USERS.board)],
};
