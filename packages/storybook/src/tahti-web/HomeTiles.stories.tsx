import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CompactBroadcastTile,
  Group,
  StudioActionTile,
  SummaryStat,
} from '@tahti-web/views/studio/home/HomeTiles';
import { CalendarDaysIcon, RadioIcon, UsersIcon } from 'lucide-react';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta = {
  title: 'Tahti/Studio/Home/HomeTiles',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/studio')],
};

export default meta;
type Story = StoryObj;

export const CompactBroadcast: Story = {
  render: () => (
    <div className="grid gap-3 sm:grid-cols-2">
      <CompactBroadcastTile
        to="/studio/go-live"
        icon={RadioIcon}
        label="Go live"
        subtitle="Start a broadcast"
        color="#e11d48"
      />
      <CompactBroadcastTile
        to="/studio/schedule"
        icon={CalendarDaysIcon}
        label="Schedule"
        subtitle="Next: Friday 20:00"
        color="#2563eb"
      />
    </div>
  ),
};

export const SummaryStats: Story = {
  render: () => (
    <Group title="This week">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryStat
          label="Listeners"
          value={128}
          note="+12%"
          icon={UsersIcon}
        />
        <SummaryStat
          label="Plays"
          value={2043}
          note="last 7 days"
          icon={RadioIcon}
        />
        <SummaryStat
          label="Shows"
          value={3}
          note="scheduled"
          icon={CalendarDaysIcon}
        />
      </div>
    </Group>
  ),
};

export const ActionTile: Story = {
  render: () => (
    <div className="max-w-40">
      <StudioActionTile
        to="/studio/sounds"
        icon={RadioIcon}
        label="Tracks"
        color="#7c3aed"
      />
    </div>
  ),
};
