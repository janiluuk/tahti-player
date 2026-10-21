import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelNotFound } from '@tahti-web/components/channel-view';
import { expect, within } from 'storybook/test';

import { withPageSurface, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof ChannelNotFound> = {
  title: 'Tahti/Channel/ChannelNotFound',
  component: ChannelNotFound,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Shown for an unknown channel slug. It first checks for a rename redirect (kept for 30 days) and follows it; without one it says the channel is gone.',
      },
    },
  },
  args: { slug: 'no-such-channel' },
  decorators: [withPageSurface(), withTahtiRouter('/channel/no-such-channel')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NoRedirect: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Channel not found')).toBeVisible();
    await expect(
      canvas.getByText(
        'This channel may have been removed or is not available.',
      ),
    ).toBeVisible();
  },
};
