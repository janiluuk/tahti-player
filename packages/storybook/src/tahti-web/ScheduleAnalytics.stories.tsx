import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScheduleAnalytics } from '@tahti-web/views/studio/schedule/ScheduleAnalytics';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof ScheduleAnalytics> = {
  title: 'Tahti/Studio/Schedule/ScheduleAnalytics',
  component: ScheduleAnalytics,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/studio/schedule'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Reads mock analytics through the API layer (`VITE_FORCE_MOCK`). */
export const Default: Story = {};
