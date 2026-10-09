import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminAddonsView } from '@tahti-web/views/admin/AdminAddonsView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminAddonsView> = {
  title: 'Tahti/Admin/AdminAddonsView',
  component: AdminAddonsView,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/addons'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Registers, edits, and deletes the add-on catalog every listener,
// artist, and admin add-on store is built from.
export const Catalog: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Channel stats' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Register a new add-on' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Admin surface installs' }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('radio', { name: 'Needs review (1)' }),
    );
    await waitFor(() =>
      expect(
        canvas.queryByRole('heading', { name: 'Channel stats' }),
      ).toBeNull(),
    );
    await expect(
      canvas.getByRole('heading', { name: 'Now spinning ticker' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Approve Now spinning ticker' }),
    ).toBeVisible();
  },
};
