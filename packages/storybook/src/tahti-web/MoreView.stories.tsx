import type { Meta, StoryObj } from '@storybook/react-vite';
import { MoreView } from '@tahti-web/views/MoreView';
import { expect, waitFor, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta = {
  title: 'Tahti/Misc/MoreView',
  component: MoreView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Diagnostics map at `/more` (only with diagnostics enabled; the route redirects to `/` otherwise): jump links, screen atlas, flow gallery, E2E runs, port inventory, design-system link, saved map comments and the legacy-vs-tahti.live feature matrix.',
      },
    },
  },
  decorators: [withTahtiRouter('/more')],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByRole('heading', { name: 'Tahti map' })).toBeVisible(),
    );
    const jump = canvas.getByRole('navigation', { name: 'Jump to cases' });
    await expect(
      within(jump).getByRole('link', { name: 'Features' }),
    ).toHaveAttribute('href', '#feature-matrix');
    await expect(
      canvas.getByRole('heading', { name: 'Feature matrix' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: /Open Storybook/ }),
    ).toHaveAttribute('href', 'http://localhost:6006');
  },
};
