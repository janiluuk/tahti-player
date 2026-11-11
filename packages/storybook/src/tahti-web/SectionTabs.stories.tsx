import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  SectionTabs,
  type SectionTabsItem,
} from '@tahti-web/components/SectionTabs';
import { HeartIcon, LibraryIcon, RadioIcon, SettingsIcon } from 'lucide-react';

import { withTahtiRouter } from './_lib/decorators';

const ITEMS: SectionTabsItem[] = [
  {
    id: 'library',
    to: '/library',
    label: 'Library',
    icon: <LibraryIcon size={16} aria-hidden />,
    active: true,
  },
  {
    id: 'radio',
    to: '/radio',
    label: 'Radio',
    icon: <RadioIcon size={16} aria-hidden />,
  },
  {
    id: 'favorites',
    to: '/listen/favorites',
    label: 'Favorites',
    icon: <HeartIcon size={16} aria-hidden />,
  },
  {
    id: 'settings',
    to: '/settings',
    label: 'Settings',
    icon: <SettingsIcon size={16} aria-hidden />,
  },
];

const meta: Meta<typeof SectionTabs> = {
  title: 'Tahti/Navigation/SectionTabs',
  component: SectionTabs,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/library')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ActiveItem: Story = {
  args: { 'aria-label': 'Library', items: ITEMS },
};

export const NoActiveItem: Story = {
  args: {
    'aria-label': 'Sections',
    items: ITEMS.map((item) => ({ ...item, active: false })),
  },
};

export const DeepRoute: Story = {
  args: {
    'aria-label': 'Library sections',
    items: ITEMS.map((item) => ({
      ...item,
      active: item.id === 'favorites',
    })),
  },
  decorators: [withTahtiRouter('/listen/favorites')],
};

// SectionTabs is always a wrapping row now (icon tabs below the primary
// section tabs, never a left-docked sidebar), so this exercises wrapping
// with many items rather than a mobile-only layout switch.
export const ManyItems: Story = {
  args: {
    'aria-label': 'Sections',
    items: [...ITEMS, ...ITEMS].map((item, index) => ({
      ...item,
      id: `${item.id}-${index}`,
      active: index === 0,
    })),
  },
};

export const MobileViewport: Story = {
  args: {
    'aria-label': 'Sections',
    items: [...ITEMS, ...ITEMS].map((item, index) => ({
      ...item,
      id: `${item.id}-${index}`,
      active: index === 0,
    })),
  },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

export const StudioManage: Story = {
  args: {
    'aria-label': 'Manage pages',
    items: [
      {
        id: 'channel',
        to: '/studio/channel',
        label: 'Channel',
        icon: <SettingsIcon size={16} aria-hidden />,
        active: true,
      },
      {
        id: 'sources',
        to: '/sources',
        label: 'Sources',
        icon: <SettingsIcon size={16} aria-hidden />,
      },
      {
        id: 'radio',
        to: '/studio/channel?radio=rotation',
        label: 'Radio',
        icon: <RadioIcon size={16} aria-hidden />,
      },
    ],
  },
  decorators: [withTahtiRouter('/studio/channel')],
};

export const AdminModeration: Story = {
  args: {
    'aria-label': 'Moderation pages',
    items: [
      {
        id: 'moderation',
        to: '/admin/moderation',
        label: 'Moderation',
        icon: <SettingsIcon size={16} aria-hidden />,
        active: true,
      },
      {
        id: 'logs',
        to: '/admin/logs',
        label: 'Logs',
        icon: <SettingsIcon size={16} aria-hidden />,
      },
    ],
  },
  decorators: [withTahtiRouter('/admin/moderation')],
};

export const StudioDeepRoute: Story = {
  args: {
    'aria-label': 'Studio pages',
    items: [
      {
        id: 'overview',
        to: '/studio',
        label: 'Overview',
        icon: <LibraryIcon size={16} aria-hidden />,
      },
      {
        id: 'schedule',
        to: '/studio/schedule',
        label: 'Schedule',
        icon: <RadioIcon size={16} aria-hidden />,
        active: true,
      },
      {
        id: 'analytics',
        to: '/studio/schedule?tab=analytics',
        label: 'Analytics',
        icon: <HeartIcon size={16} aria-hidden />,
      },
    ],
  },
  decorators: [withTahtiRouter('/studio/schedule?tab=analytics')],
};

export const AdminAllSections: Story = {
  args: {
    'aria-label': 'Admin pages',
    items: [
      {
        id: 'overview',
        to: '/admin',
        label: 'Overview',
        icon: <LibraryIcon size={16} aria-hidden />,
        active: true,
      },
      {
        id: 'content',
        to: '/admin/content',
        label: 'Content',
        icon: <RadioIcon size={16} aria-hidden />,
      },
      {
        id: 'moderation',
        to: '/admin/moderation',
        label: 'Moderation',
        icon: <SettingsIcon size={16} aria-hidden />,
      },
      {
        id: 'logs',
        to: '/admin/logs',
        label: 'Logs',
        icon: <HeartIcon size={16} aria-hidden />,
      },
    ],
  },
  decorators: [withTahtiRouter('/admin')],
};
