import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatListeningNow } from '@tahti-web/components/ChatListeningNow';
import { expect, within } from 'storybook/test';

/** Shown next to the chat's "Live" badge; the mock presence count is 12. */
const meta: Meta<typeof ChatListeningNow> = {
  title: 'Tahti/Channel/ChatListeningNow',
  component: ChatListeningNow,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { slug: 'northern-lights' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByTestId('chat-listening-now'),
    ).toHaveTextContent('12 listening');
  },
};
