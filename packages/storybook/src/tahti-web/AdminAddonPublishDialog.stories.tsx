import type { Meta, StoryObj } from '@storybook/react-vite';
import type { AdminAddon } from '@tahti-web/api/admin';
import { PublishDialog } from '@tahti-web/views/admin/addons/PublishDialog';
import { fn } from 'storybook/test';

const addon = {
  id: 'addon-channel-stats',
  slug: 'channel-stats',
  scope: 'ARTIST',
  status: 'APPROVED',
  name: 'Channel stats',
  description: 'Shows the artist channel’s current listener statistics.',
  authorName: 'Tahti',
  categories: ['stats'],
  iconUrl: null,
  currentVersion: '1.2.0',
  bundleSizeBytes: 22100,
  moderationNote: null,
  defaultConfigJson: null,
  enabledByDefault: true,
  createdAt: '2026-07-15T00:00:00.000Z',
  updatedAt: '2026-07-15T00:00:00.000Z',
} satisfies AdminAddon;

const meta: Meta<typeof PublishDialog> = {
  title: 'Tahti/Admin/AdminAddonPublishDialog',
  component: PublishDialog,
  tags: ['autodocs'],
  args: {
    addon,
    pending: false,
    error: null,
    onCancel: fn(),
    onPublish: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Uploads a new widget bundle version; the next patch version is prefilled.
export const Default: Story = {};

export const Publishing: Story = { args: { pending: true } };

export const Rejected: Story = {
  args: { error: 'Bundle is not a syntactically valid ES module' },
};
