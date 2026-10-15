import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminNav } from '@tahti-web/components/AdminNav';
import { StudioNav } from '@tahti-web/components/StudioNav';
import type { ReactNode } from 'react';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta = {
  title: 'Tahti/Chrome/Section navigation',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const frame = (children: ReactNode) => (
  <div className="bg-background text-foreground min-h-screen p-6">
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside>{children}</aside>
      <main className="border-border min-h-96 rounded-lg border p-6">
        <p className="text-foreground-secondary text-sm">
          The content area stays in place while section and submenu routes
          change.
        </p>
      </main>
    </div>
  </div>
);

export const StudioDeepRoute: Story = {
  decorators: [
    withMockAuth(MOCK_USERS.artist),
    withTahtiRouter('/studio/channel'),
  ],
  render: () => frame(<StudioNav current="/studio/channel" />),
};

export const StudioLibraryRoute: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist), withTahtiRouter('/library')],
  render: () => frame(<StudioNav current="/library" />),
};

export const AdminModerationRoute: Story = {
  decorators: [
    withMockAuth(MOCK_USERS.board),
    withTahtiRouter('/admin/moderation'),
  ],
  render: () =>
    frame(<AdminNav current="/admin/moderation" moderationPendingCount={4} />),
};

export const AdminLogsRoute: Story = {
  decorators: [withMockAuth(MOCK_USERS.board), withTahtiRouter('/admin/logs')],
  render: () => frame(<AdminNav current="/admin/logs" />),
};

export const MobileOverflow: Story = {
  decorators: [
    withMockAuth(MOCK_USERS.artist),
    withTahtiRouter('/studio/go-live'),
  ],
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => frame(<StudioNav current="/studio/go-live" />),
};
