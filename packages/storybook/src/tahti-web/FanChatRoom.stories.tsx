import type { Meta, StoryObj } from '@storybook/react-vite';
import { FanChatRoom } from '@tahti-web/components/FanChatRoom';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { FAN_ROOM_HISTORY } from './_fixtures/chat';
import { mockData } from './_lib/mock-data';

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
    const textbox = canvas.getByRole('textbox', {
      name: 'Message the fan room',
    });
    await waitFor(() => expect(textbox).toBeEnabled());
    await userEvent.type(textbox, 'Hello from the mock');
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    await expect(
      await within(log).findByText('Hello from the mock'),
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
