import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminStreamsView } from '@tahti-web/views/admin/AdminStreamsView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminStreamsView> = {
  title: 'Tahti/Admin/AdminStreamsView',
  component: AdminStreamsView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/streams'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminStreamsView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const live = await canvas.findByRole('heading', {
      name: 'Live streams (2)',
    });
    await waitFor(() => expect(live).toBeVisible());
    await expect(
      canvas.getByRole('heading', { name: 'Channel 24/7 rotation' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Channel tracks' }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Expand live streams' }),
    );
    await expect(
      canvas.getByRole('button', { name: 'Collapse live streams' }),
    ).toHaveAttribute('aria-expanded', 'true');
  },
};

export const ChannelTracksSoftCover: Story = {
  render: () => (
    <div className="p-6">
      <AdminStreamsView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const open = await canvas.findByRole('button', { name: /Open tracks/ });
    const form = within(open.closest('form') as HTMLElement);
    await userEvent.type(
      form.getByLabelText('Channel slug'),
      'northern-lights',
    );
    await userEvent.click(open);
    const list = await canvas.findByTestId('channel-tracks');
    const row = within(list).getByText('Yöajo').closest('li');
    await waitFor(() =>
      expect(row?.querySelector('img')).toHaveAttribute(
        'src',
        '/mock/dj-moonlight/cover-moonlight-drive.svg',
      ),
    );
  },
};
