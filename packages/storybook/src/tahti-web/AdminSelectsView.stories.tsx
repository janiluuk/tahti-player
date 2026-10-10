import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminSelectsView } from '@tahti-web/views/admin/AdminSelectsView';
import { expect, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminSelectsView> = {
  title: 'Tahti/Admin/AdminSelectsView',
  component: AdminSelectsView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/tahti-selects'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The curated rotation is live, with its now-playing track and tracklist. */
export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminSelectsView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Tahti Selects' }),
    ).toBeVisible();
    await expect(
      await canvas.findByRole('heading', { name: 'Stream live' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Stop stream' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Play Tahti Selects stream' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Current rotation (2)' }),
    ).toBeVisible();
    const table = within(canvas.getByRole('table'));
    await expect(
      table.getByRole('button', { name: 'Route 550' }),
    ).toBeVisible();
    await expect(
      table.getAllByRole('button', { name: 'Remove from list' }),
    ).toHaveLength(2);
    await expect(
      canvas.getByRole('button', { name: 'Fill from top list' }),
    ).toBeVisible();
  },
};
