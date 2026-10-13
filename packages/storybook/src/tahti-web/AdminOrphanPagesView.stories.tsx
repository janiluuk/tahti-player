import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminOrphanPagesView } from '@tahti-web/views/admin/orphanPages/AdminOrphanPagesView';
import { expect, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminOrphanPagesView> = {
  title: 'Tahti/Admin/AdminOrphanPagesView',
  component: AdminOrphanPagesView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/orphan-pages'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Lands on the radio station suggestions tab, with two pending stations. */
export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminOrphanPagesView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Orphan pages' }),
    ).toBeVisible();
    const tabs = within(canvas.getByRole('tablist', { name: 'Orphan pages' }));
    await expect(
      tabs.getByRole('tab', { name: /Radio station suggestions/i }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(
      await canvas.findByRole('heading', { name: 'Basso FM' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Lumo Radio' }),
    ).toBeVisible();
    await expect(
      canvas.getAllByRole('button', { name: 'Approve' }),
    ).toHaveLength(2);
  },
};
