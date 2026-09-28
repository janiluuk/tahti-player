import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioStationView } from '@tahti-web/views/RadioStationView';

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
export const Station: Story = {};

export const HlsStation: Story = { args: { stationId: 'radio-rock' } };

export const UnknownStation: Story = { args: { stationId: 'nope' } };
