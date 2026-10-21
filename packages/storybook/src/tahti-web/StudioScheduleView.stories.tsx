import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioScheduleView } from '@tahti-web/views/studio/StudioScheduleView';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof StudioScheduleView> = {
  title: 'Tahti/Studio/StudioScheduleView',
  component: StudioScheduleView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Schedule: upcoming slots and analytics. Renders against the mock API layer.',
      },
    },
  },
  decorators: [withTahtiRouter('/studio/schedule'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
