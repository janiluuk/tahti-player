import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BanknoteIcon,
  HeartIcon,
  NewspaperIcon,
  SendIcon,
  ShoppingBagIcon,
} from 'lucide-react';
import { expect, within } from 'storybook/test';

import { HubCards } from '@tahti-player/ui';

const meta = {
  title: 'Navigation/HubCards',
  component: HubCards,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A section hub: one card per tool, each opening a focused page with a back link. Used where a second row of tabs would otherwise appear (Studio → Fans, Admin → Platform). Cards link through `renderLink` (a router Link in tahti-web).',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HubCards>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StudioFans: Story = {
  args: {
    'aria-label': 'Fans tools',
    items: [
      {
        id: 'posts',
        href: '#posts',
        icon: NewspaperIcon,
        title: 'Posts',
        description: 'Updates on your channel page and in followers’ feeds.',
        badge: '2 drafts',
      },
      {
        id: 'newsletter',
        href: '#newsletter',
        icon: SendIcon,
        title: 'Newsletter',
        description: 'Email a post to the fans who signed up.',
      },
      {
        id: 'memberships',
        href: '#memberships',
        icon: HeartIcon,
        title: 'Memberships',
        description: 'Monthly support tiers fans can subscribe to.',
      },
      {
        id: 'store',
        href: '#store',
        icon: ShoppingBagIcon,
        title: 'Store',
        description: 'Items for sale on your channel page, and track sales.',
        badge: 'Not set up',
      },
      {
        id: 'earnings',
        href: '#earnings',
        icon: BanknoteIcon,
        title: 'Earnings',
        description: 'Orders, payouts, grants and the Stripe account.',
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('list', { name: 'Fans tools' });
    const links = within(list).getAllByRole('link');
    await expect(links).toHaveLength(5);
    await expect(links[0]).toHaveTextContent('2 drafts');
    await expect(links[3]).toHaveAttribute('href', '#store');
  },
};
