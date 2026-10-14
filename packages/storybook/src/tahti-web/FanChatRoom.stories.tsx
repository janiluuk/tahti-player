import type { Meta, StoryObj } from '@storybook/react-vite';
import { FanChatRoom } from '@tahti-web/components/FanChatRoom';
import { expect, fn, userEvent, within } from 'storybook/test';

import { FAN_ROOM_HISTORY } from './_fixtures/chat';
import { mockData } from './_lib/mock-data';

/**
 * The fan-room token needs the live API, so in force-mock mode the room
 * shows its history (from the `fanChatHistory` override) with the token
 * error line and the composer stays disabled.
 */
const meta: Meta<typeof FanChatRoom> = {
  title: 'Tahti/Channel/FanChatRoom',
  component: FanChatRoom,
  parameters: {
    layout: 'padded',
    mockData: mockData({ fanChatHistory: FAN_ROOM_HISTORY }),
  },
  tags: ['autodocs'],
  args: { slug: 'northern-lights', onLeave: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHistory: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const log = canvas.getByRole('log', { name: 'Fan room messages' });
    await expect(
      await within(log).findByText('Pre-saved already!'),
    ).toBeVisible();
    await expect(
      canvas.getByRole('textbox', { name: 'Message the fan room' }),
    ).toBeDisabled();
    await expect(
      await canvas.findByText('The fan room needs the live API.'),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Back to the public chat' }),
    );
    await expect(args.onLeave).toHaveBeenCalledOnce();
  },
};

export const Empty: Story = {
  parameters: { mockData: mockData({ fanChatHistory: [] }) },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText('Just fans in here'),
    ).toBeVisible();
  },
};

export const Rail: Story = {
  name: 'Right-rail height',
  args: { rail: true },
  render: (args) => (
    <div className="flex h-[32rem] flex-col">
      <FanChatRoom {...args} />
    </div>
  ),
};
