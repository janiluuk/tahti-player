import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelStageTrackMeta } from '@tahti-web/components/channel-view/ChannelStageTrackMeta';
import { expect, within } from 'storybook/test';

import { isoFromNow } from './_fixtures/channel';

const MINUTE = 60_000;

const meta: Meta<typeof ChannelStageTrackMeta> = {
  title: 'Tahti/Channel/ChannelStageTrackMeta',
  component: ChannelStageTrackMeta,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Under the channel player: time left in the current rotation track and, on curated rotations, the next track. Renders nothing when neither is known or the timing is stale.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="rounded-lg bg-black/80 p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const track = {
  title: 'Aurora Drift',
  artistName: 'Northern Lights',
  artistUsername: 'northern-lights',
  artworkUrl: null,
};

export const ProgressAndNext: Story = {
  args: {
    nowPlaying: {
      ...track,
      durationSec: 300,
      startedAt: isoFromNow(-2 * MINUTE),
    },
    next: {
      title: 'Kaamos Bloom',
      artistName: 'Saimaa Sessions',
      artistUsername: 'saimaa-sessions',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const meter = canvas.getByRole('meter', {
      name: /Track progress, 3:0\d left/,
    });
    await expect(meter).toHaveAttribute('aria-valuemax', '300');
    await expect(canvas.getByText(/3:0\d left/)).toBeVisible();
    await expect(
      canvas.getByText(/Kaamos Bloom - Saimaa Sessions/),
    ).toBeVisible();
  },
};

export const NextOnly: Story = {
  args: {
    nowPlaying: { ...track, durationSec: null },
    next: {
      title: 'Kaamos Bloom',
      artistName: 'Saimaa Sessions',
      artistUsername: null,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('meter')).toBeNull();
    await expect(canvas.getByText('Up next:')).toBeVisible();
  },
};

export const StaleTiming: Story = {
  args: {
    nowPlaying: {
      ...track,
      durationSec: 300,
      startedAt: isoFromNow(-30 * MINUTE),
    },
    next: null,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).not.toMatch(/left|Up next/);
  },
};
