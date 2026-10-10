import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminStreamsView } from '@tahti-web/views/admin/AdminStreamsView';
import { expect, userEvent, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminStreamsView> = {
  title: 'Tahti/Admin/AdminStreamsView',
  component: AdminStreamsView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/streams'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminStreamsView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Live streams (2)' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Channel 24/7 rotation' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Channel tracks' }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Expand live streams' }),
    );
    await expect(
      canvas.getByRole('button', { name: 'Collapse live streams' }),
    ).toHaveAttribute('aria-expanded', 'true');
  },
};
