import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioPlaylistsView } from '@tahti-web/views/studio/StudioPlaylistsView';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof StudioPlaylistsView> = {
  title: 'Tahti/Studio/StudioPlaylistsView',
  component: StudioPlaylistsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Playlists list. Renders against the mock API layer.',
      },
    },
  },
  decorators: [withTahtiRouter('/studio/playlists'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
