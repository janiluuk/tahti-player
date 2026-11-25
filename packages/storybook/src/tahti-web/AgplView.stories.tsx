import type { Meta, StoryObj } from '@storybook/react-vite';
import { AgplView } from '@tahti-web/views/AgplView';
import { expect, waitFor, within } from 'storybook/test';

import {
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';

const meta: Meta<typeof AgplView> = {
  title: 'Tahti/Reference/AgplView',
  component: AgplView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Public `/agpl`: where to read the source and what AGPL-3.0 means, in `LegalDocShell`.',
      },
    },
  },
  decorators: [withMockAuth(), withPageSurface(), withTahtiRouter('/agpl')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', {
          name: 'Source code & AGPL licence',
          level: 1,
        }),
      ).toBeVisible(),
    );
    await expect(
      canvas.getByRole('heading', { name: 'What AGPL-3.0 means', level: 2 }),
    ).toBeVisible();
    const hubLinks = canvas.getByRole('navigation', {
      name: 'About and legal',
    });
    await expect(
      within(hubLinks).getByRole('link', { name: 'About Tahti' }),
    ).toBeVisible();
    await expect(
      within(hubLinks).getByRole('link', { name: 'Privacy policy' }),
    ).toBeVisible();
  },
};
