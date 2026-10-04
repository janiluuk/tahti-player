import type { Meta, StoryObj } from '@storybook/react-vite';
import { MySupportTickets } from '@tahti-web/components/MySupportTickets';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth } from './_lib/decorators';

const meta: Meta<typeof MySupportTickets> = {
  title: 'Tahti/Misc/MySupportTickets',
  component: MySupportTickets,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Help → Your requests: each support request with its status, the replies from Tahti support and your own follow-ups, and a reply box. Replying to a resolved request reopens it.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    withMockAuth(MOCK_USERS.listener),
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The mock account's request, with a reply from support and one of its own. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Payout did not arrive'),
    ).toBeVisible();
    await expect(canvas.getByText('In progress')).toBeVisible();
    const replies = within(
      canvas.getByRole('list', { name: 'Replies to Payout did not arrive' }),
    );
    await expect(replies.getByText(/Tahti support/)).toBeVisible();
    await expect(replies.getByText(/^You/)).toBeVisible();
  },
};

/** Typing a follow-up and sending it adds it to the thread as "You". */
export const SendReply: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = await canvas.findByLabelText('Reply to Payout did not arrive');
    const send = canvas.getByRole('button', { name: 'Send reply' });
    await expect(send).toBeDisabled();
    await userEvent.type(box, 'Any news on this?');
    await userEvent.click(send);
    const replies = within(
      canvas.getByRole('list', { name: 'Replies to Payout did not arrive' }),
    );
    await waitFor(() =>
      expect(replies.getByText('Any news on this?')).toBeVisible(),
    );
    await expect(box).toHaveValue('');
  },
};
