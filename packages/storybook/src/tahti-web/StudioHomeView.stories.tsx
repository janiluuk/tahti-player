import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioHomeView } from '@tahti-web/views/studio/StudioHomeView';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof StudioHomeView> = {
  title: 'Tahti/Studio/StudioHomeView',
  component: StudioHomeView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio home: action tiles, stats and recent broadcasts. Renders against the mock API layer.',
      },
    },
  },
  decorators: [withTahtiRouter('/studio/'), withMockAuth(MOCK_USERS.artist)],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: /^Studio$/ }),
    ).toBeInTheDocument();
  },
};
