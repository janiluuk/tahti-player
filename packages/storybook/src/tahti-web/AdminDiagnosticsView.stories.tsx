import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminDiagnosticsView } from '@tahti-web/views/admin/AdminDiagnosticsView';
import { expect, waitFor, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminDiagnosticsView> = {
  title: 'Tahti/Admin/AdminDiagnosticsView',
  component: AdminDiagnosticsView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/diagnostics'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminDiagnosticsView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { level: 1, name: 'Diagnostics' }),
      ).toBeVisible(),
    );
    const tools = within(
      canvas.getByRole('list', { name: 'Diagnostics tools' }),
    );
    await expect(tools.getAllByRole('link')).toHaveLength(3);
    await expect(tools.getByRole('link', { name: /Logs/ })).toBeVisible();
    await expect(tools.getByRole('link', { name: /Map/ })).toBeVisible();
  },
};
