import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioStationView } from '@tahti-web/views/RadioStationView';
import { expect, userEvent, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof RadioStationView> = {
  title: 'Tahti/Listen/RadioStationView',
  component: RadioStationView,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/radio/station/radio-helsinki')],
  args: { stationId: 'radio-helsinki' },
};

export default meta;
type Story = StoryObj<typeof meta>;

// One of the curated Finnish stations: stream details, what's on air (ICY
// title when the stream sends one), play, add to Listen and the station's
// own links.
export const Station: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cards = within(canvas.getByTestId('other-stations')).getAllByTestId(
      'card',
    );
    const card = cards.find((item) =>
      within(item).queryByRole('link', { name: 'Radio Rock' }),
    );
    await expect(card).toBeDefined();
    card!.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior: 'instant',
    });
    await userEvent.click(within(card!).getByTestId('media-artwork-play'));
    await expect(card).toHaveAttribute('data-playing', 'true');
    await userEvent.click(
      await within(card!).findByRole('button', { name: 'Pause', exact: true }),
    );
    await expect(card).not.toHaveAttribute('data-playing');
  },
};

export const HlsStation: Story = { args: { stationId: 'radio-rock' } };

export const UnknownStation: Story = { args: { stationId: 'nope' } };
