import { createRoute, redirect } from '@tanstack/react-router';

import type { AdminGovernanceTabId } from '../views/admin/governance/governanceNav';
import type { AdminModerationTabId } from '../views/admin/moderation/moderationNav';
import type { AdminOrphanPageTabId } from '../views/admin/orphanPages/orphanPagesNav';
import { appLayoutRoute } from './router-core';
import {
  AdminAddonsView,
  AdminAnnouncementsView,
  AdminArtworkPresetsView,
  AdminContentView,
  AdminDashboardView,
  AdminFinancialView,
  AdminGovernanceView,
  AdminGrantCycleView,
  AdminI18nView,
  AdminLogsView,
  AdminMapView,
  AdminModerationView,
  AdminNewsView,
  AdminOrphanPagesView,
  AdminRadioView,
  AdminSelectsView,
  AdminStatusView,
  AdminStorageUserView,
  AdminStorageView,
  AdminStreamsView,
  AdminTopListsView,
  AdminUsersView,
  AdminVendorsView,
  AdminVenuesView,
} from './router-lazy-views';

export const adminRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin',
  component: AdminDashboardView,
});

export const adminActivityRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/activity',
  beforeLoad: () => {
    throw redirect({ to: '/admin/logs' });
  },
});

export const adminLogsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/logs',
  component: AdminLogsView,
});

// Beta applications, radio submissions, Selects, support, content reports,
// and feature requests used to be six standalone admin routes/pages. They
// are now tabs on one page (see AdminModerationView) — these redirect into
// the matching tab, same pattern as the /themes -> /settings/$section alias
// above.
export const adminBetaRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/beta',
  beforeLoad: () => {
    throw redirect({
      to: '/admin/moderation/$tab',
      params: { tab: 'beta' },
    });
  },
});

export const adminUsersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/users',
  component: AdminUsersView,
});

export const adminRadioRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/radio',
  component: AdminRadioView,
});

export const adminRadioSubmissionsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/radio-submissions',
  beforeLoad: () => {
    throw redirect({
      to: '/admin/moderation/$tab',
      params: { tab: 'radio-submissions' },
    });
  },
});

// Radio station suggestions used to be a standalone admin route with no nav
// entry and no in-app link (see NAVIGATION-SITEMAP.md's orphan-page audit).
// It's now a tab on the Orphan pages gathering view — redirect the old URL,
// same pattern as the six retired moderation routes above.
export const adminRadioStationSuggestionsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/radio-station-suggestions',
  beforeLoad: () => {
    throw redirect({
      to: '/admin/orphan-pages/$tab',
      params: { tab: 'radio-station-suggestions' },
    });
  },
});

export const adminOrphanPagesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/orphan-pages',
  component: () => <AdminOrphanPagesView />,
});

export const adminOrphanPagesTabRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/orphan-pages/$tab',
  component: function AdminOrphanPagesTabRoute() {
    const { tab } = adminOrphanPagesTabRoute.useParams();
    return (
      <AdminOrphanPagesView tab={tab as AdminOrphanPageTabId | undefined} />
    );
  },
});

export const adminNewsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/news',
  component: AdminNewsView,
});

export const adminSelectsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/tahti-selects',
  component: AdminSelectsView,
});

export const adminStreamsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/streams',
  component: AdminStreamsView,
});

export const adminSupportRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/support',
  beforeLoad: () => {
    throw redirect({
      to: '/admin/moderation/$tab',
      params: { tab: 'support' },
    });
  },
});

export const adminTopListsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/top-lists',
  component: AdminTopListsView,
});

export const adminContentRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/content',
  component: AdminContentView,
});

export const adminAnnouncementsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/announcements',
  component: AdminAnnouncementsView,
});

export const adminStorageRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/storage',
  component: AdminStorageView,
});

export const adminArtworkPresetsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/artwork-presets',
  component: AdminArtworkPresetsView,
});

export const adminStorageUserRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/storage/$userId',
  component: function AdminStorageUserRoute() {
    const { userId } = adminStorageUserRoute.useParams();
    return <AdminStorageUserView userId={userId} />;
  },
});

// Files is now a tab on the merged Storage view rather than its own page —
// keep the old URL alive for anyone with it bookmarked/linked.
export const adminFilesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/files',
  beforeLoad: () => {
    throw redirect({ to: '/admin/storage', search: { tab: 'files' } });
  },
});

export const adminContentReportsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/content-reports',
  beforeLoad: () => {
    throw redirect({
      to: '/admin/moderation/$tab',
      params: { tab: 'content-reports' },
    });
  },
});

export const adminFinancialRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/financial',
  component: AdminFinancialView,
});

export const adminGovernanceRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/governance',
  component: () => <AdminGovernanceView />,
});

export const adminGovernanceTabRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/governance/$tab',
  component: function AdminGovernanceTabRoute() {
    const { tab } = adminGovernanceTabRoute.useParams();
    return (
      <AdminGovernanceView tab={tab as AdminGovernanceTabId | undefined} />
    );
  },
});

export const adminReportsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/reports',
  beforeLoad: () => {
    throw redirect({
      to: '/admin/governance/$tab',
      params: { tab: 'reports' },
    });
  },
});

export const adminFeatureRequestsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/feature-requests',
  beforeLoad: () => {
    throw redirect({
      to: '/admin/moderation/$tab',
      params: { tab: 'feature-requests' },
    });
  },
});

export const adminModerationRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/moderation',
  component: () => <AdminModerationView />,
});

export const adminModerationTabRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/moderation/$tab',
  component: function AdminModerationTabRoute() {
    const { tab } = adminModerationTabRoute.useParams();
    return (
      <AdminModerationView tab={tab as AdminModerationTabId | undefined} />
    );
  },
});

export const adminGrantsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/grants',
  beforeLoad: () => {
    throw redirect({
      to: '/admin/governance/$tab',
      params: { tab: 'grants' },
    });
  },
});

export const adminGrantCycleRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/grants/$year',
  component: AdminGrantCycleView,
});

export const adminAgmRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/agm',
  beforeLoad: () => {
    throw redirect({
      to: '/admin/governance/$tab',
      params: { tab: 'agm' },
    });
  },
});

export const adminMissedShowsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/missed-shows',
  beforeLoad: () => {
    throw redirect({
      to: '/admin/moderation/$tab',
      params: { tab: 'missed-shows' },
    });
  },
});

export const adminVendorsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/vendors',
  component: AdminVendorsView,
});

export const adminMapRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/map',
  component: AdminMapView,
});

export const adminVenuesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/venues',
  component: AdminVenuesView,
});

export const adminAddonsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/addons',
  component: AdminAddonsView,
});

/** Old path — disco widgets are now called add-ons. */
export const adminDiscoWidgetsRedirectRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/disco-widgets',
  beforeLoad: () => {
    throw redirect({ to: '/admin/addons' });
  },
});

export const adminStatusRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/status',
  component: AdminStatusView,
});

export const adminI18nRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/i18n',
  component: AdminI18nView,
});
