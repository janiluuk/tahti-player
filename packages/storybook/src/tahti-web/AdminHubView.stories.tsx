import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminHubView } from '@tahti-web/views/admin/AdminHubView';
import { expect, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminHubView> = {
  title: 'Tahti/Admin/AdminHubView',
  component: AdminHubView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Admin Content, Co-op and Platform are hubs: one card per page instead of a second row of tabs. Their pages show a back link to the hub.',
      },
    },
  },
  decorators: [withMockAuth()],
  render: (args) => (
    <div className="p-6">
      <AdminHubView {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Content: Story = {
  args: { hub: 'content' },
  decorators: [withTahtiRouter('/admin/hubs/content')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'Content' }),
    ).toBeVisible();
    const links = within(
      canvas.getByRole('list', { name: 'Content tools' }),
    ).getAllByRole('link');
    await expect(links[0]).toHaveAttribute('href', '/admin/news');
    await expect(links.at(-1)).toHaveTextContent('Catalog');
  },
};

export const Coop: Story = {
  args: { hub: 'coop' },
  decorators: [withTahtiRouter('/admin/hubs/coop')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = await canvas.findByRole('list', { name: 'Co-op tools' });
    await expect(within(list).getAllByRole('link')).toHaveLength(2);
  },
};

export const Platform: Story = {
  args: { hub: 'platform' },
  decorators: [withTahtiRouter('/admin/hubs/platform')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = await canvas.findByRole('list', { name: 'Platform tools' });
    await expect(
      within(list).getByRole('link', { name: /Add-ons/ }),
    ).toHaveAttribute('href', '/admin/addons');
    await expect(within(list).getByRole('link', { name: /Map/ })).toBeVisible();
  },
};
