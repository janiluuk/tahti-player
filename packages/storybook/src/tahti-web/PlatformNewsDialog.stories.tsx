import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlatformNewsDialog } from '@tahti-web/components/PlatformNewsDialog';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof PlatformNewsDialog> = {
  title: 'Tahti/News/PlatformNewsDialog',
  component: PlatformNewsDialog,
  decorators: [withTahtiRouter('/news'), withMockAuth()],
  args: {
    post: {
      id: 'news-1',
      headline: 'Tahti is open. Come find your next favourite.',
      summary:
        'The doors are open! Discover independent music and tune into community radio.\n\nNo ads. No tracking. Just music and the people who make it.',
      authorName: 'Tahti team',
      publishedAt: '2026-10-30T08:00:00.000Z',
      imageUrl: '/artwork-presets/artwork-01.webp',
    },
    onClose: () => {},
    onUpdated: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof meta>;
export const Opening: Story = {};
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};
