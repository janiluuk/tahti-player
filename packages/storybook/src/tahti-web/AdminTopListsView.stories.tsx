import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminTopListsView } from '@tahti-web/views/admin/AdminTopListsView';
import { expect, userEvent, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminTopListsView> = {
  title: 'Tahti/Admin/AdminTopListsView',
  component: AdminTopListsView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/top-lists'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminTopListsView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'live sets' }),
    ).toBeVisible();
    await expect(canvas.getByText('Moonlight Drive')).toBeVisible();
    await expect(canvas.getByText('842 listens')).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'archive tracks' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('radio', { name: 'Most listened' }),
    ).toHaveAttribute('aria-checked', 'true');
    const least = canvas.getByRole('radio', { name: 'Least listened' });
    await userEvent.click(least);
    await expect(least).toHaveAttribute('aria-checked', 'true');
  },
};
