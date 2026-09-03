import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminMapView } from '@tahti-web/views/admin/AdminMapView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminMapView> = {
  title: 'Tahti/Admin/AdminMapView',
  component: AdminMapView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Leave: inner atlas is ScreenAtlas (Tahti/Misc/ScreenAtlas). This story is the Admin chrome wrapper.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/map'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminMapView />
    </div>
  ),
};
