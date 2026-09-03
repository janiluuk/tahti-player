import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminNav } from '@tahti-web/components/AdminNav';

import { ADMIN_SWEEP_DOCS } from './_lib/adminStoryDocs';
import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminNav> = {
  title: 'Tahti/Admin/AdminNav',
  component: AdminNav,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `${ADMIN_SWEEP_DOCS} Chrome for all Admin sections. New section stories: Content, Venues, Artwork presets, Reports, Selects, Orphan pages, Map. Grant cycle stays documented-only.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    current: '/admin',
  },
};

export const ModerationActive: Story = {
  args: {
    current: '/admin/moderation',
  },
};

export const NestedModerationRoute: Story = {
  args: {
    current: '/admin/moderation/feature-requests',
  },
  decorators: [withTahtiRouter('/admin/moderation/feature-requests')],
};

export const MobileModeration: Story = {
  args: {
    current: '/admin/moderation/missed-shows',
  },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [withTahtiRouter('/admin/moderation/missed-shows')],
};
