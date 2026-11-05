import type { Meta, StoryObj } from '@storybook/react-vite';
import { AddListenWidgetDialog } from '@tahti-web/components/AddListenWidgetDialog';
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
          "The Listen header's **Add new listen widget** button: choose a service, paste a playlist link (an example is shown) or pick one of your own playlists when signed in, and the playlist becomes its own Listen row. **Browse all add-ons** opens the full add-on store.",
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
        name: 'Add new listen widget',
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
      body.getByLabelText('Playlist link'),
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
