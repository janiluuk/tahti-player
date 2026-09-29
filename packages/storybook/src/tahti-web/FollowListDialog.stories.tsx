import type { Meta, StoryObj } from '@storybook/react-vite';
import { FollowListDialog } from '@tahti-web/components/FollowListDialog';
import { fn } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const users = [
  {
    username: 'northern-lights',
    displayName: 'Northern Lights',
    avatarUrl: null,
  },
  {
    username: 'midnight-cartography',
    displayName: 'Midnight Cartography',
    avatarUrl: null,
  },
  { username: 'dj-moonlight', displayName: 'DJ Moonlight', avatarUrl: null },
];

const meta: Meta<typeof FollowListDialog> = {
  title: 'Tahti/Listen/FollowListDialog',
  component: FollowListDialog,
  tags: ['autodocs'],
  decorators: [withTahtiRouter()],
  args: {
    isOpen: true,
    title: 'Followers',
    users,
    loading: false,
    error: false,
    hasMore: false,
    emptyMessage: 'No one follows Northern Lights yet',
    onLoadMore: fn(),
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MoreToLoad: Story = { args: { hasMore: true } };

export const Loading: Story = { args: { users: [], loading: true } };

export const Empty: Story = { args: { users: [] } };

export const Failed: Story = { args: { users: [], error: true } };
