import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelStoreEditor } from '@tahti-web/components/ChannelStoreEditor';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof ChannelStoreEditor> = {
  title: 'Tahti/Studio/ChannelStoreEditor',
  component: ChannelStoreEditor,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    withTahtiRouter('/studio/revenue'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
