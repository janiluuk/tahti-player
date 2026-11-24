import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminEncodingQueueView } from '@tahti-web/views/admin/AdminEncodingQueueView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminEncodingQueueView> = {
  title: 'Tahti/Admin/AdminEncodingQueueView',
  component: AdminEncodingQueueView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/encoding-queue'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { name: 'Encoding queue' }),
      ).toBeVisible(),
    );
    await waitFor(() =>
      expect(canvas.getByTestId('admin-queue-job-list')).toBeVisible(),
    );
    await expect(canvas.getByTestId('admin-queues-updated')).toBeVisible();
    await expect(
      canvas.getByRole('switch', { name: 'Live updates' }),
    ).toBeChecked();
  },
};

export const ActiveJobs: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId('admin-queue-job-list')).toBeVisible(),
    );
    await userEvent.click(canvas.getByRole('radio', { name: 'Active' }));
    await waitFor(() => expect(canvas.getByText(/running 3m/)).toBeVisible());
    await userEvent.click(canvas.getByRole('switch', { name: 'Live updates' }));
    await expect(
      canvas.getByRole('switch', { name: 'Live updates' }),
    ).not.toBeChecked();
  },
};
