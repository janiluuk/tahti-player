import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminRadioView } from '@tahti-web/views/admin/AdminRadioView';
import { expect, waitFor, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';
import { selectTab } from './_lib/play';

const meta: Meta<typeof AdminRadioView> = {
  title: 'Tahti/Admin/AdminRadioView',
  component: AdminRadioView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/radio'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminRadioView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rotation = await canvas.findByRole('heading', {
      name: 'Current rotation (2)',
    });
    // The Feature tab panel fades in from opacity 0 on mount.
    await waitFor(() => expect(rotation).toBeVisible());
    await expect(canvas.getByText('Night Transit')).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Eligible channels (2)' }),
    ).toBeVisible();
    await expect(
      canvas.getAllByRole('button', { name: 'Opt out' }),
    ).toHaveLength(2);
    await selectTab(canvas, 'Presets');
  },
};
