import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bell, ListMusicIcon, MessageCircle, ShuffleIcon } from 'lucide-react';
import { fn } from 'storybook/test';

import { QueueHeaderActions } from '@tahti-player/ui';

const meta = {
  title: 'Components/QueueHeaderActions',
  component: QueueHeaderActions,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Nuclear queue bar header: optional view toggles on the left, clear-queue and a "more" menu on the right. Used as `headerActions` of `PlayerWorkspace.RightSidebar` on desktop (clear + save as playlist) and in tahti-web (chat/notifications toggles, clear, save/randomize menu). Missing states: loading (no async actions today).',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-background-secondary flex w-[340px] p-2">
        <Story />
      </div>
    ),
  ],
  args: {
    onClearQueue: fn(),
    menuItems: [
      {
        id: 'save-as-playlist',
        label: 'Save queue as playlist',
        icon: <ListMusicIcon size={15} />,
        onClick: fn(),
      },
      {
        id: 'shuffle-order',
        label: 'Randomize queue order',
        icon: <ShuffleIcon size={15} />,
        onClick: fn(),
      },
    ],
  },
} satisfies Meta<typeof QueueHeaderActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithViews: Story = {
  name: 'With view toggles',
  args: {
    views: [
      {
        id: 'chat',
        label: 'Open chat',
        icon: <MessageCircle size={18} />,
        onClick: fn(),
      },
      {
        id: 'notifications',
        label: 'Open notifications',
        icon: <Bell size={18} />,
        count: 3,
        onClick: fn(),
      },
    ],
  },
};

export const ViewActive: Story = {
  name: 'Non-queue view active',
  args: {
    onClearQueue: undefined,
    menuItems: [],
    views: [
      {
        id: 'chat',
        label: 'Back to queue',
        icon: <MessageCircle size={18} />,
        isActive: true,
        onClick: fn(),
      },
      {
        id: 'notifications',
        label: 'Open notifications',
        icon: <Bell size={18} />,
        count: 120,
        onClick: fn(),
      },
    ],
  },
};

export const EmptyQueue: Story = {
  name: 'Empty queue (clear disabled)',
  args: {
    clearDisabled: true,
    menuItems: [
      {
        id: 'save-as-playlist',
        label: 'Save queue as playlist',
        icon: <ListMusicIcon size={15} />,
        disabled: true,
        onClick: fn(),
      },
    ],
  },
};
