import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminNewsView } from '@tahti-web/views/admin/AdminNewsView';
import { expect, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';
import { openDialog } from './_lib/play';

const meta: Meta<typeof AdminNewsView> = {
  title: 'Tahti/Admin/AdminNewsView',
  component: AdminNewsView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/news'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminNewsView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Fair-rotation radio now covers 9 channels'),
    ).toBeVisible();
    await expect(canvas.getByText('AGM date set for October')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Unpublish' }),
    ).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Publish' })).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Send a test notification' }),
    ).toBeVisible();
    const dialog = await openDialog(
      canvasElement,
      'Write post',
      'Write a news post',
    );
    await expect(dialog.getByLabelText('Headline')).toBeVisible();
  },
};
