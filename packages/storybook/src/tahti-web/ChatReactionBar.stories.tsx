import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatReactionBar } from '@tahti-web/components/ChatReactionBar';
import { expect, fn, userEvent, within } from 'storybook/test';

/**
 * Incoming reactions arrive over a Centrifugo socket, which force-mock mode
 * never opens, so only the send side is interactive here.
 */
const meta: Meta<typeof ChatReactionBar> = {
  title: 'Tahti/Channel/ChatReactionBar',
  component: ChatReactionBar,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { slug: 'northern-lights', onError: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

const LABELS = [
  'purple heart',
  'fire',
  'musical notes',
  'musical note',
  'glowing star',
  'clapping hands',
  'sparkles',
];

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const label of LABELS) {
      await expect(
        canvas.getByRole('button', { name: `React with ${label}` }),
      ).toBeVisible();
    }
  },
};

export const SendReaction: Story = {
  name: 'Send a reaction',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'React with sparkles' }),
    );
    await expect(await canvas.findByRole('status')).toHaveTextContent(
      'Sent ✨ (sparkles)',
    );
    await expect(args.onError).not.toHaveBeenCalled();
  },
};
