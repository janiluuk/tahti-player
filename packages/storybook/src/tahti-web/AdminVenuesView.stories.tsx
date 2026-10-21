import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminVenuesView } from '@tahti-web/views/admin/AdminVenuesView';
import { expect, userEvent, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminVenuesView> = {
  title: 'Tahti/Admin/AdminVenuesView',
  component: AdminVenuesView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/venues'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

const render = () => (
  <div className="p-6">
    <AdminVenuesView />
  </div>
);

/** A verified venue offers Unverify. */
export const Default: Story = {
  render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Venues' }),
    ).toBeVisible();
    await expect(await canvas.findByText('Northern Lights Hall')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Unverify' }),
    ).toBeVisible();
  },
};

/** Search filters by name, city, slug or submitter. */
export const Search: Story = {
  render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('Northern Lights Hall');
    const search = canvas.getByRole('textbox', { name: 'Search venues' });
    await userEvent.type(search, 'Tampere');
    await expect(await canvas.findByText('No venues found')).toBeVisible();
    await userEvent.clear(search);
    await userEvent.type(search, 'helsinki');
    await expect(await canvas.findByText('Northern Lights Hall')).toBeVisible();
  },
};
