import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminAnnouncementsView } from '@tahti-web/views/admin/AdminAnnouncementsView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';
import { expectNoDialog, findDialog } from './_lib/play';

const meta: Meta<typeof AdminAnnouncementsView> = {
  title: 'Tahti/Admin/AdminAnnouncementsView',
  component: AdminAnnouncementsView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/announcements'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminAnnouncementsView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { name: 'Announcements' }),
      ).toBeVisible(),
    );
    await waitFor(() =>
      expect(canvas.getByText('Welcome to Tahti')).toBeVisible(),
    );
    await expect(canvas.getByText('AGM reminder — October')).toBeVisible();
    await expect(canvas.getByText('Choose audio')).toBeVisible();
    await expect(canvas.getAllByRole('button', { name: 'Trim' })).toHaveLength(
      2,
    );
  },
};

export const ConfirmDelete: Story = {
  render: () => (
    <div className="p-6">
      <AdminAnnouncementsView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByText('Welcome to Tahti')).toBeVisible(),
    );
    await userEvent.click(canvas.getAllByRole('button', { name: 'Delete' })[0]);
    const dialog = await findDialog(canvasElement, /^Delete "/);
    await expect(
      dialog.getByRole('button', { name: 'Delete' }).className,
    ).toContain('bg-accent-red');
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await expectNoDialog(canvasElement);
  },
};
