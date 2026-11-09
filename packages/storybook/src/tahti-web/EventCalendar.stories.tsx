import type { Meta, StoryObj } from '@storybook/react-vite';
import { EventCalendar } from '@tahti-web/components/events/EventCalendar';
import { expect, userEvent, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof EventCalendar> = {
  title: 'Tahti/Events/EventCalendar',
  component: EventCalendar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Discover → Feed → Calendar (`/discover?tab=feed&view=calendar`): every public event in a month from `GET /api/v1/events`. Month grid on desktop, list on phones; cancelled events are struck through; Subscribe is the site-wide .ics feed.',
      },
    },
  },
  decorators: [withTahtiRouter('/discover?tab=feed&view=calendar')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Month: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByTestId('event-month-grid'),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('link', { name: /Subscribe to the calendar/ }),
    ).toBeVisible();
  },
};

export const ListLayout: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByTestId('event-month-grid');
    await userEvent.click(canvas.getByRole('radio', { name: 'List' }));
    await expect(await canvas.findByTestId('event-agenda')).toBeVisible();
  },
};

export const NextMonth: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByTestId('event-month-grid');
    await userEvent.click(canvas.getByRole('button', { name: 'Next month' }));
    await expect(
      await canvas.findByTestId('event-month-grid'),
    ).toBeInTheDocument();
  },
};
