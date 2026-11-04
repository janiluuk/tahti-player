import type { Meta, StoryObj } from '@storybook/react-vite';
import { formatScheduleWindow } from '@tahti-web/lib/scheduleTime';
import { expect, within } from 'storybook/test';

function ScheduleSample({
  startAt,
  endAt,
}: {
  startAt: string;
  endAt?: string;
}) {
  return (
    <time dateTime={startAt} className="text-sm tabular-nums">
      {formatScheduleWindow(startAt, endAt)}
    </time>
  );
}

const meta: Meta<typeof ScheduleSample> = {
  title: 'Tahti/Dates/FormatScheduleWindow',
  component: ScheduleSample,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Exact schedule windows for Studio agenda, events, listening parties and AGM meetings. Uses `formatScheduleWindow` so the clock stays visible and follows the app language.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Window: Story = {
  args: {
    startAt: '2026-11-03T16:00:00.000Z',
    endAt: '2026-11-03T17:00:00.000Z',
  },
  play: async ({ canvasElement }) => {
    const time = within(canvasElement).getByRole('time');
    await expect(time).toBeVisible();
    await expect(time.textContent ?? '').toMatch(/–/);
  },
};

export const StartOnly: Story = {
  args: {
    startAt: '2026-11-03T16:00:00.000Z',
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('time')).toBeVisible();
  },
};
