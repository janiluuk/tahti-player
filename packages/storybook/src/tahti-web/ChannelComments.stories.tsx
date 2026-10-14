import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelComments } from '@tahti-web/components/ChannelComments';
import { useAuthModalStore } from '@tahti-web/stores/authModalStore';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { CHANNEL_COMMENTS } from './_fixtures/chat';
import { MOCK_USERS, withMockAuth } from './_lib/decorators';
import { mockData } from './_lib/mock-data';

const meta: Meta<typeof ChannelComments> = {
  title: 'Tahti/Channel/ChannelComments',
  component: ChannelComments,
  parameters: {
    layout: 'padded',
    mockData: mockData({
      channelComments: { comments: CHANNEL_COMMENTS, commentsEnabled: true },
    }),
  },
  tags: ['autodocs'],
  args: { slug: 'northern-lights', isOwner: false },
  beforeEach: () => {
    useAuthModalStore.setState({ isOpen: false, mode: 'login' });
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedInVisitor: Story = {
  name: 'Signed-in visitor (deletes own comment)',
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = await canvas.findByTestId('channel-comments');
    await expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    await expect(
      canvas.queryByRole('button', { name: 'Delete comment by Lumi' }),
    ).toBeNull();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Delete comment by Liina' }),
    );
    await waitFor(() =>
      expect(within(list).getAllByRole('listitem')).toHaveLength(2),
    );
    await expect(
      canvas.queryByText('The ambient hour last week was something else.'),
    ).toBeNull();
  },
};

export const PostComment: Story = {
  name: 'Post a comment',
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = await canvas.findByRole('textbox', {
      name: 'Write a comment',
    });
    const post = canvas.getByRole('button', { name: 'Post comment' });
    await expect(post).toBeDisabled();
    await userEvent.type(box, 'Cannot wait for Friday.');
    await userEvent.click(post);
    await expect(
      await canvas.findByText('Cannot wait for Friday.'),
    ).toBeVisible();
    await expect(box).toHaveValue('');
  },
};

export const Owner: Story = {
  name: 'Owner (can delete any comment)',
  args: { isOwner: true },
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByTestId('channel-comments');
    await expect(
      canvas.getAllByRole('button', { name: /^Delete comment by/ }),
    ).toHaveLength(3);
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Log in to comment' }),
    );
    await expect(useAuthModalStore.getState()).toMatchObject({
      isOpen: true,
      mode: 'login',
    });
    await expect(canvas.queryByRole('button', { name: /^Delete/ })).toBeNull();
  },
};

export const CommentsOff: Story = {
  name: 'Comments off (older comments kept)',
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: {
    mockData: mockData({
      channelComments: { comments: CHANNEL_COMMENTS, commentsEnabled: false },
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Comments are off for this channel.'),
    ).toBeVisible();
    await expect(
      canvas.queryByRole('textbox', { name: 'Write a comment' }),
    ).toBeNull();
  },
};

export const NoCommentsYet: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: {
    mockData: mockData({
      channelComments: { comments: [], commentsEnabled: true },
    }),
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText('No comments yet.'),
    ).toBeVisible();
  },
};

export const HiddenWhenOffAndEmpty: Story = {
  name: 'Hidden (off, no comments)',
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: {
    mockData: mockData({
      channelComments: { comments: [], commentsEnabled: false },
    }),
  },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        within(canvasElement).queryByRole('region', {
          name: 'Channel comments',
        }),
      ).toBeNull(),
    );
  },
};
