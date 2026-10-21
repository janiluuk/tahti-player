import type { Meta, StoryObj } from '@storybook/react-vite';
import { RecentBroadcastRow } from '@tahti-web/views/studio/home/RecentBroadcastRow';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof RecentBroadcastRow> = {
  title: 'Tahti/Studio/Home/RecentBroadcastRow',
  component: RecentBroadcastRow,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    withTahtiRouter('/studio'),
    (Story) => (
      <ul className="border-border rounded-xl border">
        <Story />
      </ul>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const startedAt = new Date(Date.now() - 2 * 86_400_000).toISOString();

export const Published: Story = {
  args: {
    broadcast: {
      id: 'rec-1',
      title: 'Friday night set',
      source: 'RTMP',
      startedAt,
      soundId: 'arc-1',
      soundTitle: 'Friday night set',
      soundStatus: 'READY',
      durationSec: 3600,
    },
  },
};

export const Processing: Story = {
  args: {
    broadcast: {
      id: 'rec-2',
      startedAt,
      soundId: 'arc-2',
      soundStatus: 'PROCESSING',
      source: 'BROWSER_MIC',
      durationSec: 1800,
    },
  },
};
