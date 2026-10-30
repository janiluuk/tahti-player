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
    await waitFor(() =>
      expect(within(log).getByText('Pre-saved already!')).toBeVisible(),
    );
    const textbox = canvas.getByRole('textbox', {
      name: 'Message the fan room',
    });
    await waitFor(() => expect(textbox).toBeEnabled());
    await userEvent.type(textbox, 'Hello from the mock');
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    await waitFor(() =>
      expect(within(log).getByText('Hello from the mock')).toBeVisible(),
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Back to the public chat' }),
    );
    await expect(args.onLeave).toHaveBeenCalledOnce();
  },
};

export const Empty: Story = {
  parameters: { mockData: mockData({ fanChatHistory: [] }) },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        within(canvasElement).getByText('Just fans in here'),
      ).toBeVisible(),
    );
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
