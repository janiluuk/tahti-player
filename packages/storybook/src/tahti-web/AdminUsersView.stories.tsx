import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminUsersView } from '@tahti-web/views/admin/AdminUsersView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminUsersView> = {
  title: 'Tahti/Admin/AdminUsersView',
  component: AdminUsersView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/users'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminUsersView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('4 accounts')).toBeVisible();
    await expect(
      await canvas.findByRole('heading', { name: 'DJ Moonlight' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Account details' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Delete account…' }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('radio', { name: /Northern Lights/ }),
    );
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { name: 'Northern Lights' }),
      ).toBeVisible(),
    );
  },
};
