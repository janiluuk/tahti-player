import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminContentView } from '@tahti-web/views/admin/AdminContentView';
import { AdminMissedShowsPanel } from '@tahti-web/views/admin/AdminMissedShowsView';
import { AdminSelectsView } from '@tahti-web/views/admin/AdminSelectsView';
import { StudioBrandingPanel } from '@tahti-web/views/studio/StudioBrandingView';
import { StudioChannelView } from '@tahti-web/views/studio/StudioChannelView';
import { StudioCollectionsView } from '@tahti-web/views/studio/StudioCollectionsView';
import { StudioDistributionView } from '@tahti-web/views/studio/StudioDistributionView';
import { StudioEventsView } from '@tahti-web/views/studio/StudioEventsView';
import { StudioGovernanceView } from '@tahti-web/views/studio/StudioGovernanceView';
import { StudioModerationView } from '@tahti-web/views/studio/StudioModerationView';
import { StudioReleasesView } from '@tahti-web/views/studio/StudioReleasesView';
import { StudioRevenueView } from '@tahti-web/views/studio/StudioRevenueView';
import { StudioScheduleView } from '@tahti-web/views/studio/StudioScheduleView';
import { StudioSoundView } from '@tahti-web/views/studio/StudioSoundView';
import { StudioStatsView } from '@tahti-web/views/studio/StudioStatsView';
import { StudioStripeView } from '@tahti-web/views/studio/StudioStripeView';
import { StudioUploadView } from '@tahti-web/views/studio/StudioUploadView';

import {
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';

const meta: Meta = {
  title: 'Tahti/Reference/Latest view surfaces',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Rendered route-level surfaces added or reorganized in the latest Tahti pass. Each story documents the page where the surface lives. Wrapped with `withPageSurface` so background and padding match the live AppShell canvas.',
      },
    },
  },
  decorators: [withMockAuth(), withPageSurface()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AdminContent: Story = {
  parameters: {
    docs: { description: { story: 'Lives on Admin → Content.' } },
  },
  decorators: [withTahtiRouter('/admin/content')],
  render: () => <AdminContentView />,
};

export const AdminMissedShows: Story = {
  parameters: {
    docs: {
      description: { story: 'Lives on Admin → Moderation → Missed shows.' },
    },
  },
  decorators: [withTahtiRouter('/admin/moderation?tab=missed-shows')],
  render: () => <AdminMissedShowsPanel />,
};

export const AdminSelects: Story = {
  parameters: {
    docs: { description: { story: 'Lives on Admin → Manage → Selects.' } },
  },
  decorators: [withTahtiRouter('/admin/selects')],
  render: () => <AdminSelectsView />,
};

export const StudioSchedule: Story = {
  parameters: {
    docs: { description: { story: 'Lives on Studio → Schedule.' } },
  },
  decorators: [withTahtiRouter('/studio/schedule'), withMockAuth()],
  render: () => <StudioScheduleView />,
};

export const StudioStats: Story = {
  parameters: {
    docs: { description: { story: 'Lives on Studio → Stats.' } },
  },
  decorators: [withTahtiRouter('/studio/stats'), withMockAuth()],
  render: () => <StudioStatsView />,
};

export const StudioGovernance: Story = {
  parameters: {
    docs: { description: { story: 'Lives on Studio → Governance.' } },
  },
  decorators: [withTahtiRouter('/studio/governance'), withMockAuth()],
  render: () => <StudioGovernanceView />,
};

export const StudioUpload: Story = {
  parameters: {
    docs: { description: { story: 'Lives on Studio → Upload.' } },
  },
  decorators: [withTahtiRouter('/studio/upload'), withMockAuth()],
  render: () => <StudioUploadView />,
};

export const StudioSound: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Lives on Studio → Music → Sounds → track editor.',
      },
    },
  },
  decorators: [withTahtiRouter('/studio/archive/track-northern-signals')],
  render: () => <StudioSoundView id="track-northern-signals" />,
};

export const StudioSoundFixedWidth: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The Library track detail surface keeps a fixed readable width at every desktop viewport size.',
      },
    },
  },
  decorators: [withTahtiRouter('/studio/archive/track-northern-signals')],
  render: () => <StudioSoundView id="track-northern-signals" />,
};

export const StudioCollections: Story = {
  parameters: {
    docs: { description: { story: 'Lives on Studio → Music → Collections.' } },
  },
  decorators: [withTahtiRouter('/studio/collections')],
  render: () => <StudioCollectionsView />,
};

export const StudioReleases: Story = {
  parameters: {
    docs: { description: { story: 'Lives on Studio → Music → Releases.' } },
  },
  decorators: [withTahtiRouter('/studio/releases')],
  render: () => <StudioReleasesView />,
};

export const StudioRevenue: Story = {
  parameters: {
    docs: { description: { story: 'Lives on Studio → Audience.' } },
  },
  decorators: [withTahtiRouter('/studio/revenue')],
  render: () => <StudioRevenueView />,
};

export const StudioStripe: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Lives on Studio → Stripe when Stripe is configured. Connect status, Express dashboard, and charges.',
      },
    },
  },
  decorators: [withTahtiRouter('/studio/stripe')],
  render: () => <StudioStripeView />,
};

export const StudioDistribution: Story = {
  parameters: {
    docs: { description: { story: 'Lives on Studio → Distribution.' } },
  },
  decorators: [withTahtiRouter('/studio/distribution')],
  render: () => <StudioDistributionView />,
};

export const StudioChannel: Story = {
  parameters: {
    docs: { description: { story: 'Lives on Studio → Manage → Channel.' } },
  },
  decorators: [withTahtiRouter('/studio/channel')],
  render: () => <StudioChannelView />,
};

export const StudioBranding: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Lives on Settings → Artist (Branding / Gallery / Press kit / Channel Designer).',
      },
    },
  },
  decorators: [withTahtiRouter('/settings/artist')],
  render: () => <StudioBrandingPanel />,
};

export const StudioModeration: Story = {
  parameters: {
    docs: { description: { story: 'Lives on Studio → Manage → Moderation.' } },
  },
  decorators: [withTahtiRouter('/studio/moderation')],
  render: () => <StudioModerationView />,
};

export const StudioEvents: Story = {
  parameters: {
    docs: { description: { story: 'Lives on Studio → Events.' } },
  },
  decorators: [withTahtiRouter('/studio/events')],
  render: () => <StudioEventsView />,
};
