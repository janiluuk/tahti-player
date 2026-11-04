import type { Meta, StoryObj } from '@storybook/react-vite';
import { ShowEpisodeWhen } from '@tahti-web/components/ShowEpisodeWhen';
import { expect, within } from 'storybook/test';

const HOUR_MS = 3_600_000;
const iso = (offsetHours: number) =>
  new Date(Date.now() + offsetHours * HOUR_MS).toISOString();

const meta: Meta<typeof ShowEpisodeWhen> = {
  title: 'Tahti/Radio/ShowEpisodeWhen',
  component: ShowEpisodeWhen,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'When a show episode airs. An episode ahead or on air keeps its exact window (schedules never lose the time of day); an aired one shows a `ListingDate`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Upcoming: Story = {
  args: {
    episode: { startAt: iso(26), endAt: iso(28) },
    className: 'text-foreground-secondary text-xs',
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('time')).toBeNull();
  },
};

export const Aired: Story = {
  args: {
    episode: { startAt: iso(-50), endAt: iso(-48) },
    className: 'text-foreground-secondary text-xs',
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('2 days ago')).toBeVisible();
  },
};
