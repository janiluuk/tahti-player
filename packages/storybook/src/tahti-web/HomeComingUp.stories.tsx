import type { Meta, StoryObj } from '@storybook/react-vite';
import { HomeComingUp } from '@tahti-web/components/listen-view/HomeComingUp';
import { expect, waitFor, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof HomeComingUp> = {
  title: 'Tahti/Listen/HomeComingUp',
  component: HomeComingUp,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The Listen "Coming up" row: artist events as cards with their start time. Title, badge, filter and error copy come from the `web` i18n namespace.',
      },
    },
  },
  decorators: [withTahtiRouter('/')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByText('Album release show')).toBeVisible(),
    );
    await expect(canvas.getByText('Coming up')).toBeVisible();
    await expect(canvas.queryByText('Events')).toBeNull();
  },
};
