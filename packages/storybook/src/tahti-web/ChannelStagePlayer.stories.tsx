import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelStagePlayer } from '@tahti-web/components/channel-view';
import { usePlayerStore } from '@tahti-web/stores/playerStore';
import { useState, type ComponentProps } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { stubMediaPlayback } from './_fixtures/artist';
import { CHANNEL_NAME, CHANNEL_SLUG, storyChannel } from './_fixtures/channel';
import { withTahtiRouter } from './_lib/decorators';

type Props = ComponentProps<typeof ChannelStagePlayer>;

/** Holds the follow state the way ChannelView's follow hook does. */
function StagePlayerWithFollow(props: Props) {
  const [following, setFollowing] = useState(false);
  return (
    <ChannelStagePlayer
      {...props}
      follow={
        props.follow
          ? {
              following,
              busy: false,
              toggle: async () => setFollowing((value) => !value),
            }
          : null
      }
    />
  );
}

const noopFollow: Props['follow'] = {
  following: false,
  busy: false,
  toggle: async () => undefined,
};

const meta: Meta<typeof ChannelStagePlayer> = {
  title: 'Tahti/Channel/ChannelStagePlayer',
  component: ChannelStagePlayer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "The channel's player stage: now-playing overlay with waveform, time left and next track, plus chat, follow and play controls. Shown inside the hero block, or on its own when the hero is hidden.",
      },
    },
  },
  args: {
    channel: storyChannel(),
    slug: CHANNEL_SLUG,
    live: true,
    subtle: false,
    chatOn: true,
    follow: noopFollow,
    signedIn: true,
  },
  render: (args) => (
    <div className="max-w-3xl overflow-hidden rounded-xl bg-slate-900">
      <StagePlayerWithFollow {...args} />
    </div>
  ),
  decorators: [withTahtiRouter(`/channel/${CHANNEL_SLUG}`)],
  beforeEach: () => {
    const restoreMedia = stubMediaPlayback();
    return () => {
      restoreMedia();
      usePlayerStore.setState({ currentId: null, status: 'idle' });
    };
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Live: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('now playing, time left and next track', async () => {
      await expect(await canvas.findByText('Aurora Drift')).toBeVisible();
      await expect(
        canvas.getByRole('meter', { name: /Track progress/ }),
      ).toBeVisible();
      await expect(
        canvas.getByText(/Kaamos Bloom - Saimaa Sessions/),
      ).toBeVisible();
      await expect(
        canvas.getByRole('button', { name: 'Open chat' }),
      ).toBeVisible();
    });

    await step('follow toggles', async () => {
      const follow = canvas.getByRole('button', {
        name: `Follow ${CHANNEL_NAME}`,
      });
      await expect(follow).toHaveAttribute('aria-pressed', 'false');
      await userEvent.click(follow);
      await waitFor(() =>
        expect(follow).toHaveAttribute('aria-pressed', 'true'),
      );
    });

    await step('play starts the channel stream', async () => {
      const play = canvas.getByRole('button', { name: 'Play live' });
      await expect(play).toHaveAttribute('aria-pressed', 'false');
      await userEvent.click(play);
      await waitFor(() =>
        expect(usePlayerStore.getState().currentId).toBe(
          `live:${CHANNEL_SLUG}`,
        ),
      );
      await waitFor(() => expect(play).toHaveAttribute('aria-pressed', 'true'));
    });
  },
};

export const SignedOutRotation: Story = {
  args: {
    live: false,
    signedIn: false,
    chatOn: false,
    channel: storyChannel({ signalConnected: false }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Aurora Drift')).toBeVisible();
    await expect(
      canvas.queryByRole('button', { name: 'Open chat' }),
    ).toBeNull();
    await expect(
      canvas.getByRole('button', { name: 'Favorite' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Play stream' }),
    ).toBeVisible();
  },
};

export const LiveWithoutTrackInfo: Story = {
  args: { channel: storyChannel({ nowPlaying: null, nowPlayingNext: null }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Stream is live/)).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Play live' }),
    ).toBeVisible();
  },
};

export const Offline: Story = {
  args: {
    live: false,
    follow: null,
    channel: storyChannel({
      state: 'OFFLINE',
      hlsUrl: null,
      nowPlaying: null,
      nowPlayingNext: null,
    }),
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryAllByRole('button')).toHaveLength(
      0,
    );
  },
};
