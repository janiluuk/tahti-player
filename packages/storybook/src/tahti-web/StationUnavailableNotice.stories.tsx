import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { StationUnavailableNotice } from '@tahti-web/components/StationUnavailableNotice';
import type { StreamFailure } from '@tahti-web/lib/streamFailure';
import { usePlayerStore } from '@tahti-web/stores/playerStore';
import { useStationHealthStore } from '@tahti-web/stores/stationHealthStore';
import { expect, fn, userEvent, within } from 'storybook/test';

const STREAM_URL = 'https://cdn.example/hls-live/tahti-radio/master.m3u8';

function withFailure(failure: StreamFailure | null): Decorator {
  return (Story) => {
    usePlayerStore.getState().clearQueue();
    useStationHealthStore.getState().reset();
    if (failure) {
      useStationHealthStore.getState().markUnavailable(STREAM_URL, failure);
    }
    return <Story />;
  };
}

const meta: Meta<typeof StationUnavailableNotice> = {
  title: 'Tahti/Radio/StationUnavailableNotice',
  component: StationUnavailableNotice,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Shown on the Radio page and a station page when the station’s stream failed to play or failed its session health check. Renders nothing while the station is fine.',
      },
    },
  },
  args: {
    playableId: 'radio:tahti-radio',
    streamUrl: STREAM_URL,
    onPlay: fn(),
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const HttpError: Story = {
  decorators: [withFailure({ reason: 'http', status: 404 })],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText('Station unavailable · Server error (HTTP 404)'),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(args.onPlay).toHaveBeenCalledTimes(1);
  },
};

export const UnsupportedFormat: Story = {
  decorators: [withFailure({ reason: 'unsupported' })],
};

export const Unreachable: Story = {
  decorators: [withFailure({ reason: 'unreachable' })],
};

export const TimedOut: Story = {
  decorators: [withFailure({ reason: 'timeout' })],
};

export const Available: Story = {
  decorators: [withFailure(null)],
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).queryByText(/Station unavailable/),
    ).toBeNull();
  },
};
