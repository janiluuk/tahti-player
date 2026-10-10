import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminMapView } from '@tahti-web/views/admin/AdminMapView';
import { expect, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminMapView> = {
  title: 'Tahti/Admin/AdminMapView',
  component: AdminMapView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/map'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The Tahti map (screen atlas, flows and feature matrix) inside the admin shell. */
export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminMapView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Tahti map' }),
    ).toBeVisible();
    for (const section of ['Anonymous', 'Auth', 'Flows', 'Features']) {
      await expect(canvas.getByRole('link', { name: section })).toBeVisible();
    }
    await expect(canvas.getByRole('tab', { name: 'Map' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  },
};
