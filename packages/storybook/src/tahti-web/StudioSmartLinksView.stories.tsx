import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioSmartLinksView } from '@tahti-web/views/studio/StudioSmartLinksView';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof StudioSmartLinksView> = {
  title: 'Tahti/Studio/StudioSmartLinksView',
  component: StudioSmartLinksView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Music → Smart links: every release with its smart link and store links, opened from the Releases header. One header with New release as the only button.',
      },
    },
  },
  decorators: [
    withTahtiRouter('/studio/smartlinks'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Smart links', level: 1 }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'New release' }),
    ).toHaveAttribute('href', '/studio/releases');
  },
};
