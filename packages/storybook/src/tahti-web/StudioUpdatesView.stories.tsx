import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioUpdatesView } from '@tahti-web/views/studio/StudioUpdatesView';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof StudioUpdatesView> = {
  title: 'Tahti/Studio/StudioUpdatesView',
  component: StudioUpdatesView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Updates: posts and newsletters. Renders against the mock API layer.',
      },
    },
  },
  decorators: [withTahtiRouter('/studio/updates'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
