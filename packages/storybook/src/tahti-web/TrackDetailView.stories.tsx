import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrackDetailView } from '@tahti-web/views/TrackDetailView';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof TrackDetailView> = {
  title: 'Tahti/Track/TrackDetailView',
  component: TrackDetailView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "The listener-facing full-screen page for a single sound: waveform, artwork, and an ambient backdrop built from the cover art's dominant color — no edit UI for anyone who isn't the owner or a board member. Reached via `/t/$id`, and now the default destination for clicking a track anywhere in the app (`PlayableTrackTable`'s title/\"Open track\" action). The pencil button only renders for the sound's owner or a BOARD admin and opens the same `TrackEditDialog` used in Studio.",
      },
    },
  },
  args: { id: 'northern-lights-archive-1' },
  decorators: [withTahtiRouter('/t/northern-lights-archive-1')],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default view for everyone who isn't the owner or a board admin — no edit
// affordance at all, matching "no edit forms or anything" for listeners.
export const Listener: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
};

// Signed in as the sound's own artist — the pencil button opens
// TrackEditDialog (the same editor Studio's Sounds list uses).
export const Owner: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
};

// A board member viewing someone else's sound also gets the edit button,
// even though they don't own the channel.
export const Admin: Story = {
  decorators: [withMockAuth(MOCK_USERS.board)],
};

// Signed out — same read-only view as Listener, just without the
// sign-in-gated comment composer.
export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
};
