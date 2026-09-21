import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioSoundsView } from '@tahti-web/views/studio/StudioSoundsView';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof StudioSoundsView> = {
  title: 'Tahti/Studio/StudioSoundsView',
  component: StudioSoundsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Artist sound-library surface for tracks, clips, and stash files. Lives on Studio → Music → Tracks, Clips, and Files.',
      },
    },
  },
  decorators: [withTahtiRouter('/studio/sounds'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Tracks: Story = {};

export const Clips: Story = {
  parameters: { query: { folder: 'clips' } },
};
