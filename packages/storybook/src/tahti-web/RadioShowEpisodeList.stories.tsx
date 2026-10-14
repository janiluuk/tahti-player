import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioShowEpisodeList } from '@tahti-web/components/RadioShowEpisodeList';
import { expect, within } from 'storybook/test';

import { RADIO_SHOW_PAST, RADIO_SHOW_UPCOMING } from './_fixtures/radio';
import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof RadioShowEpisodeList> = {
  title: 'Tahti/Radio/RadioShowEpisodeList',
  component: RadioShowEpisodeList,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/radio/show/northern-lights')],
  args: { emptyMessage: 'Nothing has aired yet.' },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Named episode with a cover, and a talk slot that falls back to its note
// as the title and a talk icon instead of a cover.
export const Upcoming: Story = {
  args: { episodes: RADIO_SHOW_UPCOMING },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Polar Night Sessions #12')).toBeVisible();
    await expect(
      canvas.getByText('With guests from Kaiku Collective'),
    ).toBeVisible();
    await expect(
      canvas.queryByRole('link', { name: 'Listen to the recording' }),
    ).toBeNull();
  },
};

export const PastWithRecordings: Story = {
  name: 'Past, with recordings',
  args: { episodes: RADIO_SHOW_PAST },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Polar Night Sessions #11')).toBeVisible();
    await expect(
      canvas.getByText('Studio chat about the new EP'),
    ).toBeVisible();
    const links = canvas.getAllByRole('link', {
      name: 'Listen to the recording',
    });
    await expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/t/mock-rp-1',
      '/t/mock-rp-2',
    ]);
  },
};

export const Empty: Story = {
  args: { episodes: [] },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('Nothing has aired yet.'),
    ).toBeVisible();
  },
};
