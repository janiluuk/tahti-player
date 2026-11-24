import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminRadioView } from '@tahti-web/views/admin/AdminRadioView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';
import { findDialog, selectTab } from './_lib/play';

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
    await expect(
      canvas.getByText(/2 tracks in the curated rotation/),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Open playlist' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Eligible channels (2)' }),
    ).toBeVisible();
    await expect(
      canvas.getAllByRole('button', { name: 'Opt out' }),
    ).toHaveLength(2);
    await selectTab(canvas, 'Playlist');
    await expect(await canvas.findByText('Night Transit')).toBeVisible();
    await selectTab(canvas, 'Stations');
  },
};

export const PlaylistPicker: Story = {
  name: 'Playlist: add tracks, select all shown',
  render: () => (
    <div className="p-6">
      <AdminRadioView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await selectTab(canvas, 'Playlist');
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Add tracks' }),
    );
    const dialog = await findDialog(canvasElement, /Add tracks to Tahti Radio/);
    const all = await dialog.findByRole('checkbox', {
      name: 'Select all shown',
    });
    await expect(dialog.getByText('0 selected')).toBeVisible();
    await userEvent.click(all);
    await expect(all).toBeChecked();
    await expect(dialog.queryByText('0 selected')).toBeNull();
    await userEvent.click(all);
    await expect(dialog.getByText('0 selected')).toBeVisible();
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
  },
};
