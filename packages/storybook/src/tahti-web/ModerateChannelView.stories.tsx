import type { Meta, StoryObj } from '@storybook/react-vite';
import { ModerateChannelView } from '@tahti-web/views/ModerateChannelView';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof ModerateChannelView> = {
  title: 'Tahti/Listen/ModerateChannelView',
  component: ModerateChannelView,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [
    withTahtiRouter('/moderate/night-drive'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ModeratorOfAnotherChannel: Story = {
  args: { slug: 'night-drive' },
};

export const OwnChannel: Story = {
  args: { slug: 'demo' },
};

export const NotAModerator: Story = {
  args: { slug: 'somebody-else' },
};
