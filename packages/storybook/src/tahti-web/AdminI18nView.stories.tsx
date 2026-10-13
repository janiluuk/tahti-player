import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminI18nView } from '@tahti-web/views/admin/AdminI18nView';
import { expect, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';
import { openDialog } from './_lib/play';

const meta: Meta<typeof AdminI18nView> = {
  title: 'Tahti/Admin/AdminI18nView',
  component: AdminI18nView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/i18n'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminI18nView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Languages' }),
    ).toBeVisible();
    await expect(await canvas.findByText('Finnish')).toBeVisible();
    await expect(canvas.getByText('214/812 (26%)')).toBeVisible();
    const dialog = await openDialog(
      canvasElement,
      'New language',
      'New language',
    );
    await expect(dialog.getByLabelText('Code (e.g. sv)')).toBeVisible();
    await expect(dialog.getByLabelText('Name (e.g. Swedish)')).toBeVisible();
  },
};
