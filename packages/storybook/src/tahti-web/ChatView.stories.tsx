import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatView } from '@tahti-web/views/ChatView';
import { expect, within } from 'storybook/test';

import { CHANNEL_SLUG } from './_fixtures/channel';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof ChatView> = {
  title: 'Tahti/Channel/ChatView',
  component: ChatView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "The standalone chat page. `/chat` picks a channel (slug field plus the directory's channels); `/chat/$slug` shows that channel's chat panel with links back to the picker and the channel.",
      },
    },
  },
  decorators: [withMockAuth(MOCK_USERS.listener)],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Picker: Story = {
  decorators: [withTahtiRouter('/chat')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText('Channel slug')).toHaveValue(
      CHANNEL_SLUG,
    );
    await expect(
      canvas.getByRole('button', { name: 'Open chat' }),
    ).toBeEnabled();
    const suggestion = await canvas.findByRole('link', { name: CHANNEL_SLUG });
    await expect(suggestion).toHaveAttribute('href', `/chat/${CHANNEL_SLUG}`);
  },
};

export const ChannelChat: Story = {
  args: { slug: CHANNEL_SLUG },
  decorators: [withTahtiRouter(`/chat/${CHANNEL_SLUG}`)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('link', { name: '← Chat picker' }),
    ).toHaveAttribute('href', '/chat');
    await expect(
      canvas.getByRole('link', { name: 'Open channel' }),
    ).toHaveAttribute('href', `/channel/${CHANNEL_SLUG}`);
    await expect(
      await canvas.findByRole('log', { name: 'Chat messages' }),
    ).toBeVisible();
  },
};
