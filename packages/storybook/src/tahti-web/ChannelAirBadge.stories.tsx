import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelAirBadge } from '@tahti-web/components/channel-view/ChannelAirBadge';
import { expect, within } from 'storybook/test';

const HLS = 'https://stream.tahti.live/northern-lights/index.m3u8';

const meta: Meta<typeof ChannelAirBadge> = {
  title: 'Tahti/Channel/ChannelAirBadge',
  component: ChannelAirBadge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Whether a channel is on air, on its 24/7 rotation or offline. The rotation also reports `state: LIVE`, so only a connected ingest signal counts as on air.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const OnAir: Story = {
  args: {
    channel: { state: 'LIVE', hlsUrl: HLS, signalConnected: true },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/on air/i)).toBeVisible();
    await expect(canvas.queryByTestId('channel-air-badge')).toBeNull();
  },
};

export const Rotation: Story = {
  args: {
    channel: { state: 'LIVE', hlsUrl: HLS, signalConnected: false },
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByTestId('channel-air-badge'),
    ).toHaveTextContent('24/7 rotation');
  },
};

export const Offline: Story = {
  args: {
    channel: { state: 'OFFLINE', hlsUrl: null },
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByTestId('channel-air-badge'),
    ).toHaveTextContent('Offline');
  },
};
