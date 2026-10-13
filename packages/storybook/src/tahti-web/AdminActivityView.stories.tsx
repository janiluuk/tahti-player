import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminActivityView } from '@tahti-web/views/admin/AdminActivityView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminActivityView> = {
  title: 'Tahti/Admin/AdminActivityView',
  component: AdminActivityView,
  parameters: { layout: 'fullscreen' },
  // /admin/activity redirects to /admin/logs (router.tsx); point the
  // decorator at the surviving route so it isn't testing a dead path.
  decorators: [withTahtiRouter('/admin/logs'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminActivityView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Activity' }),
    ).toBeVisible();
    await expect(await canvas.findByText('Nova Drift logged in')).toBeVisible();
    await expect(canvas.getByText('9 entries')).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Export full audit log as CSV' }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('radio', { name: 'Finance & grants' }),
    );
    await waitFor(() =>
      expect(canvas.queryByText('Nova Drift logged in')).toBeNull(),
    );
  },
};
