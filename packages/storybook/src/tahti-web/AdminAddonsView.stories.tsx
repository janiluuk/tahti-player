import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminAddonsView } from '@tahti-web/views/admin/AdminAddonsView';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminAddonsView> = {
  title: 'Tahti/Admin/AdminAddonsView',
  component: AdminAddonsView,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/addons'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Registers, edits, and deletes the add-on catalog every listener,
// artist, and admin add-on store is built from.
export const Catalog: Story = {};
