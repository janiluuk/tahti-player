import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminContentView } from '@tahti-web/views/admin/AdminContentView';
import { expect, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminContentView> = {
  title: 'Tahti/Admin/AdminContentView',
  component: AdminContentView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/content'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Catalog counts, the newest content and the latest recorded broadcasts. */
export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminContentView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Content' }),
    ).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Top lists' })).toBeVisible();
    await expect(await canvas.findByText('1,842')).toBeVisible();
    await expect(canvas.getByText('48,216')).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Latest content' }),
    ).toBeVisible();
    await expect(canvas.getByText('Field Notes Vol. 2')).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Latest recorded broadcasts' }),
    ).toBeVisible();
    await expect(canvas.getByText('Late-night broadcast')).toBeVisible();
    await expect(canvas.getByText('DJ Moonlight · 114:00')).toBeVisible();
  },
};
