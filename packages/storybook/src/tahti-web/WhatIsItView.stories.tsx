import type { Meta, StoryObj } from '@storybook/react-vite';
import { WhatIsItView } from '@tahti-web/views/WhatIsItView';
import { expect, waitFor, within } from 'storybook/test';

import {
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';

const meta: Meta<typeof WhatIsItView> = {
  title: 'Tahti/Reference/What is Tahti',
  component: WhatIsItView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Public `/what-is-it` pitch: who it is for, what it does, and the feature set — reconstructed from the org README.',
      },
    },
  },
  decorators: [
    withMockAuth(),
    withPageSurface(),
    withTahtiRouter('/what-is-it'),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { name: 'What is Tahti', level: 1 }),
      ).toBeVisible(),
    );
    await expect(
      canvas.getByRole('heading', {
        name: /Broadcasting for independent artists/,
      }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: /Built for people who make/ }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: /One platform instead of five/ }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: /The pieces that replace/ }),
    ).toBeVisible();
    await expect(
      canvas.getAllByRole('link', { name: 'Join Tahti' })[0],
    ).toBeVisible();
  },
};
