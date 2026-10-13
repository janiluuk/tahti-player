import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatNotice } from '@tahti-web/components/ChatNotice';
import { chatErrorFor } from '@tahti-web/lib/chatErrors';
import { expect, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof ChatNotice> = {
  title: 'Tahti/Channel/ChatNotice',
  component: ChatNotice,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "The status line under the chat header. Sentences come from `chatErrorFor` (never the raw API code); a subscribers-only reason adds a link to the artist's subscribe page.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="border-border bg-background max-w-sm rounded-lg border">
        <Story />
      </div>
    ),
    withTahtiRouter('/channel/northern-lights'),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SubscribersOnly: Story = {
  args: {
    ...chatErrorFor('subscribers_only'),
    artistUsername: 'northern-lights',
  },
  play: async ({ canvasElement }) => {
    const notice = within(canvasElement).getByRole('status');
    await expect(notice).toHaveTextContent(
      'Only fan subscribers can post in this chat.',
    );
    await expect(
      within(notice).getByRole('link', { name: 'Subscribe' }),
    ).toHaveAttribute('href', '/subscribe/northern-lights');
  },
};

export const SubscribeWithoutArtist: Story = {
  args: { ...chatErrorFor('fan_chat_required'), artistUsername: null },
  play: async ({ canvasElement }) => {
    const notice = within(canvasElement).getByRole('status');
    await expect(notice).toHaveTextContent(
      'The fan room is for fan subscribers.',
    );
    await expect(within(notice).queryByRole('link')).toBeNull();
  },
};

export const CaptchaAgain: Story = {
  args: {
    ...chatErrorFor('captcha_required'),
    artistUsername: 'northern-lights',
  },
  play: async ({ canvasElement }) => {
    const notice = within(canvasElement).getByRole('status');
    await expect(notice).toHaveTextContent(
      'Please confirm you are not a bot again to keep chatting.',
    );
    await expect(within(notice).queryByRole('link')).toBeNull();
  },
};

export const Banned: Story = {
  args: { ...chatErrorFor('banned'), artistUsername: 'northern-lights' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent(
      'You can no longer post in this chat.',
    );
  },
};

export const UnknownError: Story = {
  args: {
    ...chatErrorFor('ECONNRESET'),
    artistUsername: 'northern-lights',
  },
  play: async ({ canvasElement }) => {
    const notice = within(canvasElement).getByRole('status');
    await expect(notice).toHaveTextContent(
      'Something went wrong with chat. Try again in a moment.',
    );
    await expect(notice).not.toHaveTextContent('ECONNRESET');
  },
};
