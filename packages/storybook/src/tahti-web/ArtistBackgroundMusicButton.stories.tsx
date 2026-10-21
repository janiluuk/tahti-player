import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArtistBackgroundMusicButton } from '@tahti-web/components/artist-view/ArtistBackgroundMusicButton';
import { usePlayerStore } from '@tahti-web/stores/playerStore';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  ARTIST_NAME,
  BACKGROUND_MUSIC_URL,
  stubMediaPlayback,
} from './_fixtures/artist';

const PLAY = `Play ${ARTIST_NAME}'s background music`;
const MUTE = `Mute ${ARTIST_NAME}'s background music`;

const meta: Meta<typeof ArtistBackgroundMusicButton> = {
  title: 'Tahti/Artist/ArtistBackgroundMusicButton',
  component: ArtistBackgroundMusicButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          "Header action that loops the artist's background music at low volume. Starting it pauses the main player; starting the main player mutes it again. Hidden when the artist has no background music.",
      },
    },
  },
  args: { url: BACKGROUND_MUSIC_URL, artistName: ARTIST_NAME },
  beforeEach: stubMediaPlayback,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Toggle: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: PLAY }));
    await expect(
      await canvas.findByRole('button', { name: MUTE }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: MUTE }));
    await expect(
      await canvas.findByRole('button', { name: PLAY }),
    ).toBeVisible();
  },
};

// The main player starting playback silences the background loop.
export const MutedByMainPlayer: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    usePlayerStore.getState().setStatus('paused');
    await userEvent.click(canvas.getByRole('button', { name: PLAY }));
    await canvas.findByRole('button', { name: MUTE });
    usePlayerStore.getState().setStatus('playing');
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: PLAY })).toBeVisible(),
    );
    usePlayerStore.getState().setStatus('paused');
  },
};

export const NoMusic: Story = {
  args: { url: null },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('button')).toBeNull();
  },
};
