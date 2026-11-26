import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  linkSpotifyArtistProfile,
  unlinkSpotifyArtistProfile,
} from '@tahti-web/api/distribution';
import { AddListenWidgetDialog } from '@tahti-web/components/AddListenWidgetDialog';
import { useAuthStore, type AuthUser } from '@tahti-web/stores/authStore';
import { useListenerWidgetsStore } from '@tahti-web/stores/listenerWidgetsStore';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withinBody } from './_lib/play';

const meta: Meta<typeof AddListenWidgetDialog> = {
  title: 'Tahti/Widgets/AddListenWidgetDialog',
  component: AddListenWidgetDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          "The Listen header's **Add widget to Listen** button: choose a service, paste a playlist link (an example is shown; Spotify also takes an artist link) or pick one of your own playlists when signed in, and the playlist becomes its own Listen row. **Browse all add-ons** opens the full add-on store.",
      },
    },
  },
  beforeEach: () => {
    useListenerWidgetsStore.setState({ instances: [] });
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AddFromLink: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', {
        name: 'Add widget to Listen',
      }),
    );
    const body = withinBody(canvasElement);
    await userEvent.click(
      await body.findByTestId('add-listen-widget-service-spotify'),
    );
    await expect(
      body.getByText(/^Example: https:\/\/open\.spotify\.com/),
    ).toBeInTheDocument();
    await userEvent.type(
      body.getByLabelText('Playlist or artist link'),
      'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
    );
    await userEvent.click(body.getByTestId('add-listen-widget-submit'));
    await waitFor(() =>
      expect(useListenerWidgetsStore.getState().instances[0]?.typeId).toBe(
        'spotify',
      ),
    );
  },
};

export const SpotifyArtistAndAlbumError: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', {
        name: 'Add widget to Listen',
      }),
    );
    const body = withinBody(canvasElement);
    await userEvent.click(
      await body.findByTestId('add-listen-widget-service-spotify'),
    );
    const link = body.getByLabelText('Playlist or artist link');
    await userEvent.type(
      link,
      'https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy',
    );
    await userEvent.click(body.getByTestId('add-listen-widget-submit'));
    await expect(await body.findByRole('alert')).toHaveTextContent(
      'This is a Spotify album link. Paste a playlist or artist link instead.',
    );
    await userEvent.clear(link);
    await userEvent.type(
      link,
      'https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF',
    );
    await userEvent.click(body.getByTestId('add-listen-widget-submit'));
    await waitFor(() =>
      expect(useListenerWidgetsStore.getState().instances[0]?.input).toBe(
        'https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF',
      ),
    );
  },
};

export const LinkedSpotifyArtist: Story = {
  beforeEach: async () => {
    useAuthStore.setState({ user: { username: 'aino' } as AuthUser });
    await linkSpotifyArtistProfile('https://open.spotify.com/artist/mock');
    return async () => {
      await unlinkSpotifyArtistProfile();
      useAuthStore.setState({ user: null });
    };
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', {
        name: 'Add widget to Listen',
      }),
    );
    const body = withinBody(canvasElement);
    await userEvent.click(
      await body.findByTestId('add-listen-widget-service-spotify'),
    );
    await expect(
      await body.findByText('Your linked Spotify artist'),
    ).toBeInTheDocument();
    await userEvent.click(body.getByRole('button', { name: /Mock Artist/ }));
    await expect(body.getByLabelText('Playlist or artist link')).toHaveValue(
      'https://open.spotify.com/artist/mock-artist',
    );
  },
};
