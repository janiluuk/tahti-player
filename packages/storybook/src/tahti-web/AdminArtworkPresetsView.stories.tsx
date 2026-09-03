import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminArtworkPresetsView } from '@tahti-web/views/admin/AdminArtworkPresetsView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminArtworkPresetsView> = {
  title: 'Tahti/Admin/AdminArtworkPresetsView',
  component: AdminArtworkPresetsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Next: preset grid <img> → ImageReveal. Keep the upload dialog on the media-upload convention.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/artwork-presets'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminArtworkPresetsView />
    </div>
  ),
};
