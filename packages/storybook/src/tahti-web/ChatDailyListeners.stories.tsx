import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatDailyListeners } from '@tahti-web/components/ChatDailyListeners';
import { expect, within } from 'storybook/test';

/** Distinct listeners today, from the mock daily-listeners count (27). */
const meta: Meta<typeof ChatDailyListeners> = {
  title: 'Tahti/Channel/ChatDailyListeners',
  component: ChatDailyListeners,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { slug: 'northern-lights' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByTestId('chat-daily-listeners'),
    ).toHaveTextContent('27 listeners today');
  },
};
