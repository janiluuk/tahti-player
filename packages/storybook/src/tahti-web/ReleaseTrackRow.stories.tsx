import type { Meta, StoryObj } from '@storybook/react-vite';
import type { StudioReleaseTrack } from '@tahti-web/api/studio-types';
import { ReleaseTrackRow } from '@tahti-web/views/studio/release-detail/ReleaseTrackRow';
import { expect, within } from 'storybook/test';

import { RELEASE_ID, UPLOAD_STATE_TRACKS } from './_fixtures/track-release';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const TRACK: StudioReleaseTrack = {
  id: 'story-rt-ready',
  position: 1,
  title: 'Night Transit',
  soundId: 'arch-mock-2',
  durationSec: 288,
};

const meta: Meta<typeof ReleaseTrackRow> = {
  title: 'Tahti/Studio/Release detail/ReleaseTrackRow',
  component: ReleaseTrackRow,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "One track on a public release page: play, the track's own download when the release allows it, and a shop link.",
      },
    },
  },
  decorators: [withTahtiRouter('/'), withMockAuth(MOCK_USERS.artist)],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playable: Story = {
  args: { track: TRACK, releaseId: RELEASE_ID },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Night Transit')).toBeVisible();
  },
};

export const Playing: Story = {
  args: { track: TRACK, isPlaying: true },
};

export const NoAudioYet: Story = {
  args: { track: UPLOAD_STATE_TRACKS[0]! },
};
