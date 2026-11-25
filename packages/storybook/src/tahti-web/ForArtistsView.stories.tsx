import type { Meta, StoryObj } from '@storybook/react-vite';
import { ForArtistsView } from '@tahti-web/views/ForArtistsView';
import { expect, waitFor, within } from 'storybook/test';

import {
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';

const meta: Meta<typeof ForArtistsView> = {
  title: 'Tahti/Reference/ForArtistsView',
  component: ForArtistsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Public `/for-artists` pitch: the six studio pillars, how to start a channel, and the legal hub links.',
      },
    },
  },
  decorators: [
    withMockAuth(),
    withPageSurface(),
    withTahtiRouter('/for-artists'),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { name: 'Tahti for artists', level: 1 }),
      ).toBeVisible(),
    );
    await expect(
      canvas.getByRole('heading', {
        name: 'Six things your channel does for you.',
        level: 2,
      }),
    ).toBeVisible();
    await expect(canvas.getAllByRole('article').length).toBeGreaterThanOrEqual(
      6,
    );
  },
};
