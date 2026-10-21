import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioDistributionView } from '@tahti-web/views/studio/StudioDistributionView';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof StudioDistributionView> = {
  title: 'Tahti/Studio/StudioDistributionView',
  component: StudioDistributionView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Distribution: release ops, delivery and guides. Renders against the mock API layer.',
      },
    },
  },
  decorators: [withTahtiRouter('/studio/distribution'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
