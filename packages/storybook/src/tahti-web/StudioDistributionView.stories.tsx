import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioDistributionView } from '@tahti-web/views/studio/StudioDistributionView';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

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
  decorators: [
    withTahtiRouter('/studio/distribution'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', {
        name: /^Distribution$|^Jakelu$/,
      }),
    ).toBeInTheDocument();
  },
};
