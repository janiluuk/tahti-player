import type { Meta, StoryObj } from '@storybook/react-vite';
import type { TahtiPlayable } from '@tahti-web/api/types';
import {
  PlayableTrackContextMenu,
  PlayableTrackResolverContext,
} from '@tahti-web/components/PlayableTrackContextMenu';
import { playableToTrack } from '@tahti-web/lib/playableToTrack';
import { useSoundLikesStore } from '@tahti-web/stores/soundLikesStore';
import { MoreHorizontalIcon } from 'lucide-react';
import { expect, userEvent, waitFor } from 'storybook/test';

import type { Track } from '@tahti-player/model';
import { Button } from '@tahti-player/ui';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { withinBody } from './_lib/play';

const meta: Meta<typeof PlayableTrackContextMenu> = {
  title: 'Tahti/Track/PlayableTrackContextMenu',
  component: PlayableTrackContextMenu,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/library')],
};

export default meta;
type Story = StoryObj<typeof meta>;

// The trigger is a real Radix dropdown — click it in the canvas to open the
// menu (matches the house TrackContextMenu.stories.tsx convention).
const trigger = (
  <Button size="icon" aria-label="Track options">
    <MoreHorizontalIcon size={18} />
  </Button>
);

const archiveTrack: Track = {
  title: 'Aurora',
  artists: [{ name: 'Northern Lights', roles: ['performer'] }],
  durationMs: 214_000,
  artwork: {
    items: [
      { url: 'https://picsum.photos/seed/aurora/128/128', purpose: 'cover' },
    ],
  },
  source: { provider: 'tahti', id: 'archive:archive-item-1' },
};

// A live/radio signal has no archive item to save to a playlist, so the
// "Add to playlist" action is omitted for it.
const liveTrack: Track = {
  title: 'Live at Tahti Radio',
  artists: [{ name: 'DJ Frost', roles: ['performer'] }],
  source: { provider: 'tahti', id: 'live:tahti-radio' },
};

export const ArchiveTrack: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Playlist actions use TrackContextMenu.Submenu (Storybook With Submenu). Archive tracks also get an Audio tools submenu when signed in.',
      },
    },
  },
  args: { track: archiveTrack, children: trigger },
};

export const LiveTrackNoPlaylistAction: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Live/radio rows omit Add to playlist and Audio tools (no archive sound id).',
      },
    },
  },
  args: { track: liveTrack, children: trigger },
};

const likeablePlayable: TahtiPlayable = {
  id: 'sound:story-like-track',
  kind: 'sound',
  title: 'Aurora',
  artist: 'Northern Lights',
  streamUrl: 'https://example.com/aurora.mp3',
  protocol: 'https',
  channelSlug: 'northern-lights',
};

export const LikeAndUnlike: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Signed in, the menu likes or unlikes the track on the account: the same like the row heart sets, so Library → Liked tracks lists it.',
      },
    },
  },
  decorators: [
    withMockAuth(MOCK_USERS.listener),
    (Story) => (
      <PlayableTrackResolverContext.Provider
        value={(track) =>
          track.source.id === likeablePlayable.id ? likeablePlayable : null
        }
      >
        <Story />
      </PlayableTrackResolverContext.Provider>
    ),
  ],
  beforeEach: () => {
    useSoundLikesStore.getState().reset();
  },
  args: { track: playableToTrack(likeablePlayable), children: trigger },
  play: async ({ canvasElement }) => {
    const body = withinBody(canvasElement);
    await userEvent.click(body.getByRole('button', { name: 'Track options' }));
    await userEvent.click(await body.findByText('Like'));
    await waitFor(() =>
      expect(useSoundLikesStore.getState().liked.has('story-like-track')).toBe(
        true,
      ),
    );
    await userEvent.click(
      await body.findByRole('button', { name: 'Track options' }),
    );
    await expect(await body.findByText('Unlike')).toBeInTheDocument();
  },
};
