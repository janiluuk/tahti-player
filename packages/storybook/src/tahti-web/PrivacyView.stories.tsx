import type { Meta, StoryObj } from '@storybook/react-vite';
import { PrivacyView } from '@tahti-web/views/PrivacyView';
import { expect, waitFor, within } from 'storybook/test';

import {
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';

const meta: Meta<typeof PrivacyView> = {
  title: 'Tahti/Reference/PrivacyView',
  component: PrivacyView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Public `/privacy`: privacy policy in `LegalDocShell`.',
      },
    },
  },
  decorators: [withMockAuth(), withPageSurface(), withTahtiRouter('/privacy')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { name: 'Privacy policy', level: 1 }),
      ).toBeVisible(),
    );
    await expect(
      canvas.getByRole('heading', { name: 'Your rights under GDPR', level: 2 }),
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
