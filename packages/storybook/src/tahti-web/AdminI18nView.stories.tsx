import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminI18nView } from '@tahti-web/views/admin/AdminI18nView';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminI18nView> = {
  title: 'Tahti/Admin/AdminI18nView',
  component: AdminI18nView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Input/FilePicker already. Leave CSV import.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/i18n'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <AdminI18nView />
    </div>
  ),
};
