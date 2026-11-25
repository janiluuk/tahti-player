import type { Meta, StoryObj } from '@storybook/react-vite';
import { TermsView } from '@tahti-web/views/TermsView';
import { expect, waitFor, within } from 'storybook/test';

import {
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';

const meta: Meta<typeof TermsView> = {
  title: 'Tahti/Reference/TermsView',
  component: TermsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Public `/terms`: terms of service in `LegalDocShell`.',
      },
    },
  },
  decorators: [withMockAuth(), withPageSurface(), withTahtiRouter('/terms')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { name: 'Terms of service', level: 1 }),
      ).toBeVisible(),
    );
    await expect(
      canvas.getByRole('heading', { name: 'Governing law', level: 2 }),
    ).toBeVisible();
    const hubLinks = canvas
      .getAllByRole('list')
      .find((list) =>
        within(list).queryByRole('link', { name: 'About Tahti' }),
      );
    await expect(hubLinks).toBeDefined();
    await expect(
      within(hubLinks!).getByRole('link', { name: 'Privacy policy' }),
    ).toBeVisible();
  },
};
