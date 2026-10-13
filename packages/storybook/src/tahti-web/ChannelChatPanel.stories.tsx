import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelChatPanel } from '@tahti-web/components/ChannelChatPanel';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { CHANNEL_SLUG } from './_fixtures/channel';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';

/** ChannelChatPanel remembers the last joined handle here. */
const HANDLE_KEY = 'tahti-web-chat-handle';

const MINUTE = 60_000;

const chatData = mockData({
  chatAccess: { artistUsername: CHANNEL_SLUG },
  chatHistory: () => [
    {
      id: 'h1',
      handle: 'liina',
      text: 'That bassline at the drop!',
      ts: Date.now() - 4 * MINUTE,
    },
    {
      id: 'h2',
      handle: 'kaamos_fan',
      text: 'Tuning in from Oulu',
      ts: Date.now() - 2 * MINUTE,
      supporter: true,
    },
    {
      id: 'h3',
      handle: 'Northern Lights',
      text: 'Thanks for listening - new EP on Friday',
      ts: Date.now() - MINUTE,
      channelRole: 'owner',
    },
  ],
});

function chatError(code: string) {
  return mockData({
    ...chatData,
    chatToken: () => {
      throw new Error(code);
    },
  });
}

/**
 * History and access come from the mock API. There is no Centrifugo in
 * Storybook, so `VITE_FORCE_MOCK` puts the panel in local-echo mode: a
 * joined handle's messages are appended locally instead of published.
 */
const meta: Meta<typeof ChannelChatPanel> = {
  title: 'Tahti/Channel/ChannelChatPanel',
  component: ChannelChatPanel,
  parameters: { layout: 'padded', mockData: chatData },
  tags: ['autodocs'],
  args: { slug: CHANNEL_SLUG },
  decorators: [withTahtiRouter(`/channel/${CHANNEL_SLUG}`)],
  beforeEach: () => {
    localStorage.removeItem(HANDLE_KEY);
    return () => localStorage.removeItem(HANDLE_KEY);
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

async function findLog(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const log = await canvas.findByRole('log', { name: 'Chat messages' });
  await within(log).findByText('Thanks for listening - new EP on Friday');
  return { canvas, log };
}

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement, step }) => {
    const { canvas, log } = await findLog(canvasElement);

    await step('history shows handles and messages', async () => {
      await expect(within(log).getByText('Northern Lights')).toHaveClass(
        'text-primary',
      );
      await expect(within(log).getByText('kaamos_fan')).toHaveClass(
        'font-semibold',
      );
    });

    await step('joining without a handle explains why', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Join chat' }));
      await expect(await canvas.findByRole('status')).toHaveTextContent(
        'Pick a handle to join.',
      );
    });

    await step('join and send', async () => {
      await userEvent.type(canvas.getByLabelText('Handle'), 'aurora');
      await userEvent.click(canvas.getByRole('button', { name: 'Join chat' }));
      const compose = await canvas.findByPlaceholderText('Message as aurora');
      await expect(canvas.queryByRole('status')).toBeNull();
      const send = canvas.getByRole('button', { name: 'Send' });
      await expect(send).toBeDisabled();
      await userEvent.type(compose, 'Hello from Storybook{Enter}');
      await expect(
        await within(log).findByText('Hello from Storybook'),
      ).toBeVisible();
      await expect(compose).toHaveValue('');
    });
  },
};

export const SignedIn: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const { canvas } = await findLog(canvasElement);
    await expect(
      canvas.getByText(
        `Signed in as @${MOCK_USERS.listener.username} - captcha not required.`,
      ),
    ).toBeVisible();
  },
};

export const SubscribersOnly: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: {
    mockData: mockData({
      chatAccess: { subscribersOnly: true, canPostInChat: false },
    }),
  },
  play: async ({ canvasElement }) => {
    const { canvas } = await findLog(canvasElement);
    const notice = await canvas.findByRole('status');
    await expect(notice).toHaveTextContent(
      'Only fan subscribers can post here. You can still read along.',
    );
    await expect(
      within(notice).getByRole('link', { name: 'Subscribe' }),
    ).toHaveAttribute('href', `/subscribe/${CHANNEL_SLUG}`);
  },
};

export const ChatOff: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: { mockData: mockData({ chatAccess: { chatEnabled: false } }) },
  play: async ({ canvasElement }) => {
    const { canvas } = await findLog(canvasElement);
    await expect(
      await canvas.findByText('The artist has turned chat off.'),
    ).toBeVisible();
    await expect(
      canvas.queryByRole('button', { name: 'Join chat' }),
    ).toBeNull();
  },
};

export const JoinRefused: Story = {
  name: 'Join refused (banned)',
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: { mockData: chatError('banned') },
  play: async ({ canvasElement }) => {
    const { canvas } = await findLog(canvasElement);
    await userEvent.type(canvas.getByLabelText('Handle'), 'liina');
    await userEvent.click(canvas.getByRole('button', { name: 'Join chat' }));
    const notice = await canvas.findByRole('status');
    await expect(notice).toHaveTextContent(
      'You can no longer post in this chat.',
    );
    await expect(
      canvas.getByRole('button', { name: 'Join chat' }),
    ).toBeEnabled();
  },
};

export const JoinNeedsSubscription: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: { mockData: chatError('subscribers_only') },
  play: async ({ canvasElement }) => {
    const { canvas } = await findLog(canvasElement);
    await userEvent.type(canvas.getByLabelText('Handle'), 'liina');
    await userEvent.click(canvas.getByRole('button', { name: 'Join chat' }));
    const notice = await canvas.findByRole('status');
    await expect(notice).toHaveTextContent(
      'Only fan subscribers can post in this chat.',
    );
    await expect(
      within(notice).getByRole('link', { name: 'Subscribe' }),
    ).toBeVisible();
  },
};

export const JoinChatSwitchedOff: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: { mockData: chatError('chat_disabled') },
  play: async ({ canvasElement }) => {
    const { canvas } = await findLog(canvasElement);
    await userEvent.type(canvas.getByLabelText('Handle'), 'liina');
    await userEvent.click(canvas.getByRole('button', { name: 'Join chat' }));
    await expect(
      await canvas.findByText('The artist has turned chat off.'),
    ).toBeVisible();
    await waitFor(() => expect(canvas.queryByLabelText('Handle')).toBeNull());
  },
};

export const FanRoom: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: { mockData: mockData({ chatAccess: { canJoinFanChat: true } }) },
  play: async ({ canvasElement }) => {
    const { canvas } = await findLog(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Fan room' }));
    await expect(
      await canvas.findByRole('log', { name: 'Fan room messages' }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Back to the public chat' }),
    );
    await expect(
      await canvas.findByRole('log', { name: 'Chat messages' }),
    ).toBeVisible();
  },
};

export const Compact: Story = {
  decorators: [withMockAuth()],
  args: { compact: true },
  play: async ({ canvasElement }) => {
    const { log } = await findLog(canvasElement);
    await expect(log.parentElement).toHaveClass('max-h-80');
  },
};

export const Rail: Story = {
  name: 'Right-rail height',
  decorators: [withMockAuth()],
  render: (args) => (
    <div className="h-[32rem]">
      <ChannelChatPanel {...args} />
    </div>
  ),
  args: { rail: true },
  play: async ({ canvasElement }) => {
    const { log } = await findLog(canvasElement);
    await expect(log).toHaveClass('min-h-0');
    await expect(log.parentElement).toHaveClass('h-full');
  },
};
