import type { Meta, StoryObj } from '@storybook/react-vite';
import { CommunityStoriesWidget } from '@tahti-web/components/discover/CommunityStoriesWidget';
import { expect, fn, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const meta = {
  title: 'Tahti/Discover/CommunityStoriesWidget',
  component: CommunityStoriesWidget,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Discover widget: the newest posts from every artist (`GET /api/v1/community/stories`) as wide story cards with the post category and age. Renders full width above the Discover widget columns. Stories here use the mock API.',
      },
    },
  },
  decorators: [withTahtiRouter('/discover')],
  args: { onRemove: fn() },
} satisfies Meta<typeof CommunityStoriesWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText(/^News · /)).toBeVisible();
    await expect(
      canvas.getByText('Hi, I make the flutes you hear here'),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Remove widget' }),
    ).toBeVisible();
  },
};
