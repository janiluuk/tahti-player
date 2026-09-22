import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScheduledTimes } from '@tahti-web/views/studio/schedule/ScheduledTimes';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof ScheduledTimes> = {
  title: 'Tahti/Studio/Schedule/ScheduledTimes',
  component: ScheduledTimes,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/studio/schedule')],
  args: { onEdit: () => {} },
};

export default meta;
type Story = StoryObj<typeof meta>;

const day = 86_400_000;
const at = (days: number, hour: number) => {
  const d = new Date(Date.now() + days * day);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export const Upcoming: Story = {
  args: {
    items: [
      {
        id: 's1',
        title: 'Late Night Ambient',
        startAt: at(1, 22),
        endAt: at(1, 23),
        tagline: 'Slow synths until midnight',
        visibility: 'PUBLIC',
        episodeNumber: 12,
      },
      {
        id: 's2',
        title: 'Fan Club Session',
        startAt: at(3, 20),
        endAt: at(3, 21),
        visibility: 'FAN_ONLY',
      },
    ],
  },
};

export const Empty: Story = { args: { items: [] } };
