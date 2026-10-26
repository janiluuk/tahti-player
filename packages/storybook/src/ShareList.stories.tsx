import { Meta, StoryObj } from '@storybook/react-vite';
import {
  ChromeIcon,
  GlobeIcon,
  MonitorIcon,
  SmartphoneIcon,
  TabletIcon,
} from 'lucide-react';
import { expect, within } from 'storybook/test';

import { ShareList } from '@tahti-player/ui';

const meta = {
  title: 'Components/ShareList',
  component: ShareList,
  tags: ['autodocs'],
} satisfies Meta<typeof ShareList>;

export default meta;
type Story = StoryObj<typeof ShareList>;

export const Browsers: Story = {
  args: {
    title: 'Browser',
    items: [
      {
        id: 'chrome',
        label: 'Chrome',
        share: 0.52,
        icon: <ChromeIcon size={14} />,
      },
      {
        id: 'safari',
        label: 'Mobile Safari',
        share: 0.27,
        icon: <GlobeIcon size={14} />,
      },
      {
        id: 'firefox',
        label: 'Firefox',
        share: 0.12,
        icon: <GlobeIcon size={14} />,
      },
      { id: 'other', label: 'Other', share: 0.09 },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { name: 'Browser' }),
    ).toBeVisible();
    await expect(canvas.getAllByRole('meter')).toHaveLength(4);
    await expect(canvas.getByText('9 %')).toBeVisible();
  },
};

export const DeviceTypes: Story = {
  args: {
    title: 'Device type',
    items: [
      {
        id: 'phone',
        label: 'Smartphone',
        share: 0.61,
        icon: <SmartphoneIcon size={14} />,
      },
      {
        id: 'desktop',
        label: 'Desktop',
        share: 0.33,
        icon: <MonitorIcon size={14} />,
      },
      {
        id: 'tablet',
        label: 'Tablet',
        share: 0.06,
        icon: <TabletIcon size={14} />,
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    title: 'City',
    items: [],
    emptyLabel: 'Cities show once at least 5 listeners share one.',
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText(
        'Cities show once at least 5 listeners share one.',
      ),
    ).toBeVisible();
  },
};
