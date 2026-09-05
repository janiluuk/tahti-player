import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  redirect,
} from '@tanstack/react-router';

import { AppShell } from './components/AppShell';
import { diagnosticsEnabled } from './lib/buildPolicy';
import {
  appendSearchParams,
  resolveDashboardCallbackRedirect,
} from './lib/cutoverReturns';
import { parseDiscoverSearch } from './lib/discoverTabs';
import { resolveDashboardRedirect } from './lib/prodPathRedirects';
import { useAuthStore } from './stores/authStore';
import type { AdminModerationTabId } from './views/admin/moderation/moderationNav';
import type { AdminOrphanPageTabId } from './views/admin/orphanPages/orphanPagesNav';
import { AgplView } from './views/AgplView';
import { ArtistView } from './views/ArtistView';
import { ChannelView } from './views/ChannelView';
import { ChatView } from './views/ChatView';
import { CollectionView } from './views/CollectionView';
import { DashboardAliasView } from './views/DashboardAliasView';
import { DiscoverView } from './views/DiscoverView';
import {
  EmbedChannelView,
  EmbedCollectionView,
  EmbedReleaseView,
} from './views/EmbedViews';
import { FavoritesView } from './views/FavoritesView';
import { FeedView } from './views/FeedView';
import { ForgotPasswordView } from './views/ForgotPasswordView';
import { GreenRoomView } from './views/GreenRoomView';
import { JamView } from './views/JamView';
import { JoinView } from './views/JoinView';
import { ListenView } from './views/ListenView';
import { LoginView } from './views/LoginView';
import { MessagesView } from './views/MessagesView';
import { NewsView } from './views/NewsView';
import { OnboardingView } from './views/OnboardingView';
import { PrivacyView } from './views/PrivacyView';
import { RadioScheduleView } from './views/RadioScheduleView';
import { RadioShowView } from './views/RadioShowView';
import { RadioView } from './views/RadioView';
import { ResetPasswordView } from './views/ResetPasswordView';
import { SetupPasswordView } from './views/SetupPasswordView';
import { SignupPaymentView } from './views/SignupPaymentView';
import { SmartLinkView } from './views/SmartLinkView';
import { StudioBrandingView } from './views/studio/StudioBrandingView';
import { StudioChannelView } from './views/studio/StudioChannelView';
import { StudioCollectionsView } from './views/studio/StudioCollectionsView';
import { StudioEditorListView } from './views/studio/StudioEditorListView';
import { StudioEditorProjectView } from './views/studio/StudioEditorProjectView';
import { StudioEventsView } from './views/studio/StudioEventsView';
import { StudioGoLiveView } from './views/studio/StudioGoLiveView';
import { StudioHomeView } from './views/studio/StudioHomeView';
import { StudioPlaylistEditorView } from './views/studio/StudioPlaylistsView';
import { StudioReleaseDetailView } from './views/studio/StudioReleaseDetailView';
import { StudioReleasesView } from './views/studio/StudioReleasesView';
import { StudioScheduleView } from './views/studio/StudioScheduleView';
import { StudioSetupChannelRedirect } from './views/studio/StudioSetupChannelRedirect';
import { StudioShowsView } from './views/studio/StudioShowsView';
import { StudioSoundsView } from './views/studio/StudioSoundsView';
import { StudioStatsDetailView } from './views/studio/StudioStatsDetailView';
import { StudioStatsView } from './views/studio/StudioStatsView';
import { StudioUploadView } from './views/studio/StudioUploadView';
import { SubscribeView } from './views/SubscribeView';
import { TermsView } from './views/TermsView';
import { TrackDetailView } from './views/TrackDetailView';
import { VenueDetailView } from './views/VenueDetailView';
import { VenueRegisterView } from './views/VenueRegisterView';
import { VerifyView } from './views/VerifyView';
import { WhatsNewView } from './views/WhatsNewView';

// Board-only, gated on user.isBoard — never needed on the anonymous listen
// path, so keep these 22 pages out of the main bundle entirely rather than
// paying for them on every page load (see CUTOVER.md's Bundle budget item).
const AdminAgmView = lazyRouteComponent(
  () => import('./views/admin/AdminAgmView'),
  'AdminAgmView',
);
const StudioSoundView = lazyRouteComponent(
  () => import('./views/studio/StudioSoundView'),
  'StudioSoundView',
);
const StudioCollectionEditView = lazyRouteComponent(
  () => import('./views/studio/StudioCollectionEditView'),
  'StudioCollectionEditView',
);
const StudioDistributionView = lazyRouteComponent(
  () => import('./views/studio/StudioDistributionView'),
  'StudioDistributionView',
);
const StudioProEditorView = lazyRouteComponent(
  () => import('./views/studio/StudioProEditorView'),
  'StudioProEditorView',
);
const StudioMasteringView = lazyRouteComponent(
  () => import('./views/studio/StudioMasteringView'),
  'StudioMasteringView',
);
const StudioShowDetailView = lazyRouteComponent(
  () => import('./views/studio/StudioShowDetailView'),
  'StudioShowDetailView',
);
const StudioEpisodeReviewView = lazyRouteComponent(
  () => import('./views/studio/StudioShowDetailView'),
  'StudioEpisodeReviewView',
);
const MoreView = lazyRouteComponent(
  () => import('./views/MoreView'),
  'MoreView',
);
const FeatureRequestsView = lazyRouteComponent(
  () => import('./views/FeatureRequestsView'),
  'FeatureRequestsView',
);
const GovernanceView = lazyRouteComponent(
  () => import('./views/GovernanceView'),
  'GovernanceView',
);
const PublicGovernanceHistoryView = lazyRouteComponent(
  () => import('./views/PublicGovernanceHistoryView'),
  'PublicGovernanceHistoryView',
);
const HelpArticleView = lazyRouteComponent(
  () => import('./views/HelpView'),
  'HelpArticleView',
);
const HelpHubView = lazyRouteComponent(
  () => import('./views/HelpView'),
  'HelpHubView',
);
const LegalView = lazyRouteComponent(
  () => import('./views/LegalView'),
  'LegalView',
);
const WhatIsItView = lazyRouteComponent(
  () => import('./views/WhatIsItView'),
  'WhatIsItView',
);
const StatusView = lazyRouteComponent(
  () => import('./views/StatusView'),
  'StatusView',
);
const TransparencyMethodologyView = lazyRouteComponent(
  () => import('./views/TransparencyMethodologyView'),
  'TransparencyMethodologyView',
);
const TransparencyView = lazyRouteComponent(
  () => import('./views/TransparencyView'),
  'TransparencyView',
);
const TransparencyGrantYearView = lazyRouteComponent(
  () => import('./views/TransparencyGrantYearView'),
  'TransparencyGrantYearView',
);
const SettingsView = lazyRouteComponent(
  () => import('./views/settings/SettingsView'),
  'SettingsView',
);
const AdminLogsView = lazyRouteComponent(
  () => import('./views/admin/AdminLogsView'),
  'AdminLogsView',
);
const AdminAnnouncementsView = lazyRouteComponent(
  () => import('./views/admin/AdminAnnouncementsView'),
  'AdminAnnouncementsView',
);
const AdminDashboardView = lazyRouteComponent(
  () => import('./views/admin/AdminDashboardView'),
  'AdminDashboardView',
);
const AdminFinancialView = lazyRouteComponent(
  () => import('./views/admin/AdminFinancialView'),
  'AdminFinancialView',
);
const AdminGovernanceView = lazyRouteComponent(
  () => import('./views/admin/AdminGovernanceView'),
  'AdminGovernanceView',
);
const AdminReportsView = lazyRouteComponent(
  () => import('./views/admin/AdminReportsView'),
  'AdminReportsView',
);
const AdminGrantsView = lazyRouteComponent(
  () => import('./views/admin/AdminGrantsView'),
  'AdminGrantsView',
);
const AdminGrantCycleView = lazyRouteComponent(
  () => import('./views/admin/AdminGrantCycleView'),
  'AdminGrantCycleView',
);
const AdminI18nView = lazyRouteComponent(
  () => import('./views/admin/AdminI18nView'),
  'AdminI18nView',
);
const AdminNewsView = lazyRouteComponent(
  () => import('./views/admin/AdminNewsView'),
  'AdminNewsView',
);
const AdminModerationView = lazyRouteComponent(
  () => import('./views/admin/moderation/AdminModerationView'),
  'AdminModerationView',
);
const AdminOrphanPagesView = lazyRouteComponent(
  () => import('./views/admin/orphanPages/AdminOrphanPagesView'),
  'AdminOrphanPagesView',
);
const AdminRadioView = lazyRouteComponent(
  () => import('./views/admin/AdminRadioView'),
  'AdminRadioView',
);
const AdminStatusView = lazyRouteComponent(
  () => import('./views/admin/AdminStatusView'),
  'AdminStatusView',
);
const AdminVendorsView = lazyRouteComponent(
  () => import('./views/admin/AdminVendorsView'),
  'AdminVendorsView',
);
const AdminMapView = lazyRouteComponent(
  () => import('./views/admin/AdminMapView'),
  'AdminMapView',
);
const AdminStorageView = lazyRouteComponent(
  () => import('./views/admin/AdminStorageView'),
  'AdminStorageView',
);
const AdminStorageUserView = lazyRouteComponent(
  () => import('./views/admin/AdminStorageUserView'),
  'AdminStorageUserView',
);
const AdminArtworkPresetsView = lazyRouteComponent(
  () => import('./views/admin/AdminArtworkPresetsView'),
  'AdminArtworkPresetsView',
);
const AdminStreamsView = lazyRouteComponent(
  () => import('./views/admin/AdminStreamsView'),
  'AdminStreamsView',
);
const AdminSelectsView = lazyRouteComponent(
  () => import('./views/admin/AdminSelectsView'),
  'AdminSelectsView',
);
const AdminTopListsView = lazyRouteComponent(
  () => import('./views/admin/AdminTopListsView'),
  'AdminTopListsView',
);
const AdminContentView = lazyRouteComponent(
  () => import('./views/admin/AdminContentView'),
  'AdminContentView',
);
const AdminUsersView = lazyRouteComponent(
  () => import('./views/admin/AdminUsersView'),
  'AdminUsersView',
);
const AdminVenuesView = lazyRouteComponent(
  () => import('./views/admin/AdminVenuesView'),
  'AdminVenuesView',
);
const AdminDiscoWidgetsView = lazyRouteComponent(
  () => import('./views/admin/AdminDiscoWidgetsView'),
  'AdminDiscoWidgetsView',
);
const StudioEventCreateView = lazyRouteComponent(
  () => import('./views/studio/StudioEventCreateView'),
  'StudioEventCreateView',
);
const StudioGovernanceView = lazyRouteComponent(
  () => import('./views/studio/StudioGovernanceView'),
  'StudioGovernanceView',
);
const StudioRecordingsView = lazyRouteComponent(
  () => import('./views/studio/StudioRecordingsView'),
  'StudioRecordingsView',
);
const StudioRevenueView = lazyRouteComponent(
  () => import('./views/studio/StudioRevenueView'),
  'StudioRevenueView',
);
const StudioStripeView = lazyRouteComponent(
  () => import('./views/studio/StudioStripeView'),
  'StudioStripeView',
);
const StudioStashView = lazyRouteComponent(
  () => import('./views/studio/StudioStashView'),
  'StudioStashView',
);
const StudioTrackInsightsView = lazyRouteComponent(
  () => import('./views/studio/StudioTrackInsightsView'),
  'StudioTrackInsightsView',
);
const StudioUpdatesView = lazyRouteComponent(
  () => import('./views/studio/StudioUpdatesView'),
  'StudioUpdatesView',
);

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: AppShell,
});

const listenRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/',
  component: ListenView,
});

const listenFeedRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/listen/feed',
  component: () => <ListenView tab="feed" />,
});

const listenFavoritesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/listen/favorites',
  beforeLoad: () => {
    throw redirect({ to: '/favorites' });
  },
});

const listenHistoryRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/listen/history',
  component: () => <ListenView tab="history" />,
});

const radioRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/radio',
  component: RadioView,
});

const discoverRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/discover',
  validateSearch: parseDiscoverSearch,
  component: DiscoverView,
});

const scheduleRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/schedule',
  validateSearch: (
    search: Record<string, unknown>,
  ): { station?: 'radio' | 'mine' } => ({
    station:
      search.station === 'mine'
        ? 'mine'
        : search.station === 'radio'
          ? 'radio'
          : undefined,
  }),
  component: RadioScheduleView,
});

const radioShowRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/radio/show/$channelSlug',
  component: () => {
    const { channelSlug } = radioShowRoute.useParams();
    return <RadioShowView channelSlug={channelSlug} />;
  },
});

const themesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/themes',
  beforeLoad: () => {
    throw redirect({ to: '/settings/$section', params: { section: 'themes' } });
  },
});

const settingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings',
  component: () => <SettingsView />,
});

const settingsSectionRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings/$section',
  component: function SettingsSectionRoute() {
    const { section } = settingsSectionRoute.useParams();
    return <SettingsView sectionId={section} />;
  },
});

const feedRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/feed',
  component: FeedView,
});

const onboardingRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/onboarding',
  component: OnboardingView,
});

const adminRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin',
  component: AdminDashboardView,
});

const adminActivityRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/activity',
  beforeLoad: () => {
    throw redirect({ to: '/admin/logs' });
  },
});

const adminLogsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/logs',
  component: AdminLogsView,
});

// Beta applications, radio submissions, Selects, support, content reports,
// and feature requests used to be six standalone admin routes/pages. They
// are now tabs on one page (see AdminModerationView) — these redirect into
// the matching tab, same pattern as the /themes -> /settings/$section alias
// above.
const adminBetaRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/beta',
  beforeLoad: () => {
    throw redirect({
      to: '/admin/moderation/$tab',
      params: { tab: 'beta' },
    });
  },
});

const adminUsersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/users',
  component: AdminUsersView,
});

const adminRadioRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/radio',
  component: AdminRadioView,
});

const adminRadioSubmissionsRoute = createRoute({
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
const adminRadioStationSuggestionsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/radio-station-suggestions',
  beforeLoad: () => {
    throw redirect({
      to: '/admin/orphan-pages/$tab',
      params: { tab: 'radio-station-suggestions' },
    });
  },
});

const adminOrphanPagesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/orphan-pages',
  component: () => <AdminOrphanPagesView />,
});

const adminOrphanPagesTabRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/orphan-pages/$tab',
  component: function AdminOrphanPagesTabRoute() {
    const { tab } = adminOrphanPagesTabRoute.useParams();
    return (
      <AdminOrphanPagesView tab={tab as AdminOrphanPageTabId | undefined} />
    );
  },
});

const adminNewsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/news',
  component: AdminNewsView,
});

const adminSelectsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/tahti-selects',
  component: AdminSelectsView,
});

const adminStreamsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/streams',
  component: AdminStreamsView,
});

const adminSupportRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/support',
  beforeLoad: () => {
    throw redirect({
      to: '/admin/moderation/$tab',
      params: { tab: 'support' },
    });
  },
});

const adminTopListsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/top-lists',
  component: AdminTopListsView,
});

const adminContentRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/content',
  component: AdminContentView,
});

const adminAnnouncementsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/announcements',
  component: AdminAnnouncementsView,
});

const adminStorageRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/storage',
  component: AdminStorageView,
});

const adminArtworkPresetsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/artwork-presets',
  component: AdminArtworkPresetsView,
});

const adminStorageUserRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/storage/$userId',
  component: function AdminStorageUserRoute() {
    const { userId } = adminStorageUserRoute.useParams();
    return <AdminStorageUserView userId={userId} />;
  },
});

// Files is now a tab on the merged Storage view rather than its own page —
// keep the old URL alive for anyone with it bookmarked/linked.
const adminFilesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/files',
  beforeLoad: () => {
    throw redirect({ to: '/admin/storage', search: { tab: 'files' } });
  },
});

const adminContentReportsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/content-reports',
  beforeLoad: () => {
    throw redirect({
      to: '/admin/moderation/$tab',
      params: { tab: 'content-reports' },
    });
  },
});

const adminFinancialRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/financial',
  component: AdminFinancialView,
});

const adminGovernanceRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/governance',
  component: AdminGovernanceView,
});

const adminReportsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/reports',
  component: AdminReportsView,
});

const adminFeatureRequestsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/feature-requests',
  beforeLoad: () => {
    throw redirect({
      to: '/admin/moderation/$tab',
      params: { tab: 'feature-requests' },
    });
  },
});

const adminModerationRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/moderation',
  component: () => <AdminModerationView />,
});

const adminModerationTabRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/moderation/$tab',
  component: function AdminModerationTabRoute() {
    const { tab } = adminModerationTabRoute.useParams();
    return (
      <AdminModerationView tab={tab as AdminModerationTabId | undefined} />
    );
  },
});

const adminGrantsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/grants',
  component: AdminGrantsView,
});

const adminGrantCycleRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/grants/$year',
  component: AdminGrantCycleView,
});

const adminAgmRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/agm',
  component: AdminAgmView,
});

const adminMissedShowsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/missed-shows',
  beforeLoad: () => {
    throw redirect({
      to: '/admin/moderation/$tab',
      params: { tab: 'missed-shows' },
    });
  },
});

const adminVendorsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/vendors',
  component: AdminVendorsView,
});

const adminMapRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/map',
  component: AdminMapView,
});

const adminVenuesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/venues',
  component: AdminVenuesView,
});

const adminDiscoWidgetsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/disco-widgets',
  component: AdminDiscoWidgetsView,
});

const adminStatusRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/status',
  component: AdminStatusView,
});

const adminI18nRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/i18n',
  component: AdminI18nView,
});

// Its History tab pulls in react-activity-calendar plus the other
// HistoryCharts components — keep that off the anonymous listen path's
// main bundle rather than loading it on every page.
const LibraryView = lazyRouteComponent(
  () => import('./views/LibraryView'),
  'LibraryView',
);

const libraryRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library',
  component: () => <LibraryView tab="library" />,
});

const librarySoundsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/sounds',
  component: () => <LibraryView tab="sounds" />,
});

const libraryReleasesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/releases',
  beforeLoad: () => {
    throw redirect({ to: '/studio/releases' });
  },
});

const libraryCollectionsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/collections',
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    tab?: 'collections' | 'recordings' | 'media' | 'stash' | 'embeds';
  } => ({
    tab:
      search.tab === 'recordings' ||
      search.tab === 'media' ||
      search.tab === 'stash' ||
      search.tab === 'embeds'
        ? search.tab
        : undefined,
  }),
  component: function LibraryCollectionsRoute() {
    const search = libraryCollectionsRoute.useSearch();
    return <LibraryView tab="collections" collectionTab={search.tab} />;
  },
});

const libraryRecordingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/recordings',
  beforeLoad: () => {
    throw redirect({ to: '/studio/recordings' });
  },
});

const libraryFavoritesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/favorites',
  beforeLoad: () => {
    throw redirect({ to: '/favorites' });
  },
});

const libraryHistoryRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/history',
  beforeLoad: () => {
    throw redirect({ to: '/listen/history' });
  },
});

const librarySmartLinksRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/smartlinks',
  component: () => <LibraryView tab="smartlinks" />,
});

const libraryMediaRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/media',
  component: () => <LibraryView tab="media" />,
});

const libraryLocalRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/local',
  component: () => <LibraryView tab="local" />,
});

const libraryMessagesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/messages',
  beforeLoad: () => {
    throw redirect({ to: '/messages' });
  },
});

const messagesAliasRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/messages',
  component: MessagesView,
});

const messagesThreadRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/messages/$id',
  component: function MessagesThreadRoute() {
    const { id } = messagesThreadRoute.useParams();
    return <MessagesView threadId={id} />;
  },
});

const favoritesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/favorites',
  component: FavoritesView,
});

const historyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/history',
  beforeLoad: () => {
    throw redirect({ to: '/listen/history' });
  },
});

// Retired per-source connect/manage page — every source now configures
// inline in Settings → Add-ons → Import (PluginStorePanel's OAuthServiceCard
// and HearthisCard). These two routes stay only as redirects, since a real
// OAuth provider callback (or an old bookmark/email link) can still land on
// them; preserve `?status=` the same way SettingsView does for the
// mixcloud callback (see cutoverReturns.ts).
function redirectToImportAddOns(): never {
  const status = new URLSearchParams(window.location.search).get('status');
  throw redirect({
    to: '/settings/$section',
    params: { section: 'plugin-store' },
    search: { category: 'import', ...(status ? { status } : {}) },
  });
}

const sourcesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sources',
  beforeLoad: redirectToImportAddOns,
});

const sourcesTabRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sources/$id',
  beforeLoad: redirectToImportAddOns,
});

const venuesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/venues',
  beforeLoad: () => {
    throw redirect({ to: '/discover', search: { tab: 'venues' } });
  },
});

const venuesRegisterRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/venues/register',
  component: VenueRegisterView,
});

const venueDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/v/$slug',
  component: function VenueDetailRoute() {
    const { slug } = venueDetailRoute.useParams();
    return <VenueDetailView slug={slug} />;
  },
});

const moreRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/more',
  beforeLoad: () => {
    if (!diagnosticsEnabled) {
      throw redirect({ to: '/' });
    }
  },
  component: MoreView,
});

const whatsNewRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/whats-new',
  component: WhatsNewView,
});

const newsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/news',
  component: NewsView,
});

const channelRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/channel/$slug',
  validateSearch: (search: Record<string, unknown>): { edit?: boolean } => {
    const raw = search.edit;
    if (raw === true || raw === 1 || raw === '1' || raw === 'true') {
      return { edit: true };
    }
    return {};
  },
  component: function ChannelRoute() {
    const { slug } = channelRoute.useParams();
    return <ChannelView slug={slug} />;
  },
});

const artistRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/u/$username',
  component: function ArtistRoute() {
    const { username } = artistRoute.useParams();
    return <ArtistView username={username} />;
  },
});

const jamRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/jam/$code',
  component: function JamRoute() {
    const { code } = jamRoute.useParams();
    return <JamView code={code} />;
  },
});

const collectionRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/u/$username/c/$slug',
  component: function CollectionRoute() {
    const { username, slug } = collectionRoute.useParams();
    return <CollectionView username={username} slug={slug} />;
  },
});

const trackDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/t/$id',
  validateSearch: (search: Record<string, unknown>): { key?: string } => ({
    key: typeof search.key === 'string' ? search.key : undefined,
  }),
  component: function TrackDetailRoute() {
    const { id } = trackDetailRoute.useParams();
    const { key } = trackDetailRoute.useSearch();
    return <TrackDetailView id={id} shareKey={key} />;
  },
});

const smartLinkRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/r/$slug',
  component: function SmartLinkRoute() {
    const { slug } = smartLinkRoute.useParams();
    return <SmartLinkView slug={slug} />;
  },
});

const chatIndexRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/chat',
  component: () => <ChatView />,
});

const chatSlugRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/chat/$slug',
  component: function ChatSlugRoute() {
    const { slug } = chatSlugRoute.useParams();
    return <ChatView slug={slug} />;
  },
});

const subscribeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/subscribe/$username',
  component: function SubscribeRoute() {
    const { username } = subscribeRoute.useParams();
    return <SubscribeView username={username} />;
  },
});

const greenRoomRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/u/$username/green-room',
  component: function GreenRoomRoute() {
    const { username } = greenRoomRoute.useParams();
    return <GreenRoomView username={username} />;
  },
});

const transparencyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/transparency',
  component: TransparencyView,
});

const transparencyMethodologyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/transparency/methodology',
  component: TransparencyMethodologyView,
});

const transparencyGrantYearRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/transparency/grants/$year',
  component: function TransparencyGrantYearRoute() {
    const { year } = transparencyGrantYearRoute.useParams();
    return <TransparencyGrantYearView year={Number(year)} />;
  },
});

const helpRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/help',
  component: HelpHubView,
});

const helpSlugRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/help/$slug',
  component: function HelpSlugRoute() {
    const { slug } = helpSlugRoute.useParams();
    return <HelpArticleView slug={slug} />;
  },
});

const joinRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/join',
  component: JoinView,
});

/** Legacy /apply and /signup URLs — land on Join, which already explains
 * whether registration is open, rather than 404ing an inbound link. */
const applyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/apply',
  beforeLoad: () => {
    throw redirect({ to: '/join' });
  },
});

const signupRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/signup',
  beforeLoad: () => {
    throw redirect({ to: '/join' });
  },
});

const signupPaymentRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/signup/payment',
  component: SignupPaymentView,
});

const verifyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/verify',
  component: VerifyView,
});

const setupPasswordRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/setup-password',
  component: SetupPasswordView,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/forgot-password',
  component: ForgotPasswordView,
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/reset-password',
  component: ResetPasswordView,
});

const loginRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/login',
  component: LoginView,
});

const accountRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/account',
  beforeLoad: () => {
    throw redirect({
      to: '/settings/$section',
      params: { section: 'account' },
    });
  },
});

const statusRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/status',
  component: StatusView,
});

const governanceRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/governance',
  component: GovernanceView,
});

const publicGovernanceHistoryRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/governance/history',
  component: PublicGovernanceHistoryView,
});

const featureRequestsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/governance/feature-requests',
  component: FeatureRequestsView,
});

const aboutRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/about',
  component: () => <LegalView slug="about" />,
});

const whatIsItRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/what-is-it',
  component: WhatIsItView,
});

const howItWorksRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/how-it-works',
  component: () => <LegalView slug="how-it-works" />,
});

const forArtistsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/for-artists',
  component: () => <LegalView slug="for-artists" />,
});

const termsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/terms',
  component: TermsView,
});

const privacyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/privacy',
  component: PrivacyView,
});

const agplRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/agpl',
  component: AgplView,
});

const studioRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio',
  component: StudioHomeView,
});

const studioGoLiveRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/go-live',
  component: StudioGoLiveView,
});

const studioBroadcastInfoRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/info',
  beforeLoad: () => {
    throw redirect({ to: '/studio/go-live' });
  },
});

const studioSoundsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/sounds',
  component: StudioSoundsView,
});

/** Old path, kept as a redirect — linked from bookmarks, old shares, and
 * the "archive" naming this page used before the Sounds rename. */
const studioArchiveRedirectRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/archive',
  beforeLoad: () => {
    throw redirect({ to: '/studio/sounds' });
  },
});

const studioRecordingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/recordings',
  component: StudioRecordingsView,
});

const studioSoundItemRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/sounds/$id',
  component: function StudioSoundItemRoute() {
    const { id } = studioSoundItemRoute.useParams();
    return <StudioSoundView id={id} />;
  },
});

const studioArchiveItemRedirectRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/archive/$id',
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/studio/sounds/$id', params });
  },
});

const studioSoundEditorRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/sounds/$id/editor',
  component: function StudioSoundEditorRoute() {
    const { id } = studioSoundEditorRoute.useParams();
    return <StudioProEditorView soundId={id} />;
  },
});

const studioArchiveEditorRedirectRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/archive/$id/editor',
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/studio/sounds/$id/editor', params });
  },
});

const studioMasteringRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/mastering/$id',
  component: function StudioMasteringRoute() {
    const { id } = studioMasteringRoute.useParams();
    return <StudioMasteringView soundId={id} />;
  },
});

const studioReleasesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/releases',
  component: StudioReleasesView,
});

const studioReleaseDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/releases/$id',
  component: function StudioReleaseDetailRoute() {
    const { id } = studioReleaseDetailRoute.useParams();
    return <StudioReleaseDetailView id={id} />;
  },
});

const studioCollectionsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/collections',
  component: StudioCollectionsView,
});

const studioCollectionEditRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/collections/$slug',
  component: function StudioCollectionEditRoute() {
    const { slug } = studioCollectionEditRoute.useParams();
    return <StudioCollectionEditView slug={slug} />;
  },
});

const studioUploadRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/upload',
  beforeLoad: () => {
    throw redirect({ to: '/library/upload' });
  },
});

const libraryUploadRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/upload',
  component: StudioUploadView,
});

const studioEditorRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/editor',
  component: StudioEditorListView,
});

const studioEditorProjectRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/editor/$id',
  component: function StudioEditorProjectRoute() {
    const { id } = studioEditorProjectRoute.useParams();
    return <StudioEditorProjectView id={id} />;
  },
});

const studioStashRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/stash',
  component: StudioStashView,
});

const studioScheduleRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/schedule',
  component: StudioScheduleView,
});

const studioStatsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/stats',
  component: StudioStatsView,
});

const studioGovernanceRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/governance',
  validateSearch: (search: Record<string, unknown>): { tab?: 'topics' } => ({
    tab:
      search.tab === 'topics' || search.tab === 'feature-requests'
        ? 'topics'
        : undefined,
  }),
  component: function StudioGovernanceRoute() {
    const search = studioGovernanceRoute.useSearch();
    return <StudioGovernanceView tab={search.tab ?? 'motions'} />;
  },
});

const studioStatsDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/stats/detail',
  component: StudioStatsDetailView,
});

const studioSetupChannelRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/setup-channel',
  component: StudioSetupChannelRedirect,
});

const studioChannelRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/channel',
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === 'string' ? search.tab : undefined,
  }),
  component: StudioChannelView,
});

const studioBrandingRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/branding',
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: 'gallery' | 'press-kit' | 'channel-designer' } => ({
    tab:
      search.tab === 'gallery' ||
      search.tab === 'press-kit' ||
      search.tab === 'channel-designer'
        ? search.tab
        : undefined,
  }),
  component: StudioBrandingView,
});

const studioShowsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/shows',
  component: StudioShowsView,
});

const studioShowDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/shows/$id',
  component: function StudioShowDetailRoute() {
    const { id } = studioShowDetailRoute.useParams();
    return <StudioShowDetailView id={id} />;
  },
});

const studioEpisodeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/shows/episodes/$episodeId',
  component: function StudioEpisodeRoute() {
    const { episodeId } = studioEpisodeRoute.useParams();
    return <StudioEpisodeReviewView episodeId={episodeId} />;
  },
});

const studioPlaylistsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/playlists',
  beforeLoad: () => {
    throw redirect({ to: '/studio/collections' });
  },
});

const studioPlaylistEditRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/playlists/$slug',
  component: function StudioPlaylistEditRoute() {
    const { slug } = studioPlaylistEditRoute.useParams();
    return <StudioPlaylistEditorView slug={slug} />;
  },
});

const studioUpdatesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/updates',
  component: StudioUpdatesView,
});

const studioRevenueRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/revenue',
  component: StudioRevenueView,
});

const studioStripeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/stripe',
  component: StudioStripeView,
});

const studioDistributionRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/distribution',
  component: StudioDistributionView,
});

const studioModerationRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/moderation',
  beforeLoad: () => {
    throw redirect({
      to: '/settings/$section',
      params: { section: 'channel' },
    });
  },
});

const studioVenuesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/venues',
  beforeLoad: () => {
    throw redirect({ to: '/admin/venues' });
  },
});

const studioEventsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/events',
  component: StudioEventsView,
});

const studioEventCreateRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/events/new',
  component: StudioEventCreateView,
});

const studioInsightsIndexRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/insights',
  component: StudioStatsDetailView,
});

const studioInsightsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/insights/$kind/$id',
  component: function StudioInsightsRoute() {
    const { kind, id } = studioInsightsRoute.useParams();
    return (
      <StudioTrackInsightsView
        kind={kind === 'release-tracks' ? 'release-tracks' : 'sound'}
        id={id}
      />
    );
  },
});

const embedChannelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/embed/c/$slug',
  component: function EmbedChannelRoute() {
    const { slug } = embedChannelRoute.useParams();
    return <EmbedChannelView slug={slug} />;
  },
});

const embedReleaseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/embed/r/$id',
  component: function EmbedReleaseRoute() {
    const { id } = embedReleaseRoute.useParams();
    return <EmbedReleaseView id={id} />;
  },
});

/** Matches Tahti `/embed/col/:slug` + API `GET /api/v1/embed/col/:slug`. */
const embedColRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/embed/col/$slug',
  component: function EmbedColRoute() {
    const { slug } = embedColRoute.useParams();
    return <EmbedCollectionView slug={slug} />;
  },
});

/** Friendly alias aligned with public collection URLs. */
const embedUserColRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/embed/u/$username/c/$slug',
  component: function EmbedUserColRoute() {
    const { username, slug } = embedUserColRoute.useParams();
    return <EmbedCollectionView slug={slug} username={username} />;
  },
});

/** Production path aliases — tahti.live URLs keep working on the Nuclear SPA. */
const listenAliasRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/listen',
  beforeLoad: () => {
    throw redirect({ to: '/' });
  },
});

const prodChannelAliasRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/c/$slug',
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/channel/$slug',
      params: { slug: params.slug },
    });
  },
});

const prodSubscribeAliasRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/u/$username/subscribe',
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/subscribe/$username',
      params: { username: params.username },
    });
  },
});

const dashboardIndexAliasRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/dashboard',
  component: DashboardAliasView,
});

function waitForAuthHydration(): Promise<void> {
  if (useAuthStore.getState().hydrated) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const unsub = useAuthStore.subscribe((state) => {
      if (state.hydrated) {
        unsub();
        resolve();
      }
    });
  });
}

const OAUTH_IMPORT_STATUS_KEYS: Record<string, string> = {
  soundcloud: 'sc',
  bandcamp: 'bc',
  'google-drive': 'gd',
};

const dashboardSplatAliasRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/dashboard/$',
  beforeLoad: async ({ params, search }) => {
    const splat =
      typeof params._splat === 'string'
        ? params._splat
        : String((params as { _splat?: string })._splat ?? '');
    // This route also matches bare `/dashboard` (empty splat) ahead of the
    // `/dashboard` index route — apply the same artist-vs-listener split
    // here instead of falling through to the `''` → `/studio` prod alias.
    if (!splat.replace(/^\/+|\/+$/g, '')) {
      const callbackRedirect = resolveDashboardCallbackRedirect(
        search as Record<string, unknown>,
      );
      if (callbackRedirect) {
        throw redirect({ href: callbackRedirect });
      }
      await waitForAuthHydration();
      const user = useAuthStore.getState().user;
      throw redirect({ href: user?.channel ? '/studio' : '/feed' });
    }
    // Prod's OAuth import callback (SoundCloud/Bandcamp/Google Drive) lands
    // on `/dashboard/upload/import/:provider?sc=|bc=|gd=connected|error|login`
    // — route straight to the matching Sources tab with the status intact.
    const importMatch = /^upload\/import\/([\w-]+)/.exec(splat);
    if (importMatch?.[1] && OAUTH_IMPORT_STATUS_KEYS[importMatch[1]]) {
      const provider = importMatch[1];
      const statusKey = OAUTH_IMPORT_STATUS_KEYS[provider]!;
      const status = (search as Record<string, unknown>)[statusKey];
      throw redirect({
        to: '/sources/$id',
        params: { id: provider },
        search: typeof status === 'string' ? { status } : undefined,
      });
    }
    throw redirect({
      href: appendSearchParams(
        resolveDashboardRedirect(splat),
        search as Record<string, unknown>,
      ),
    });
  },
});

const routeTree = rootRoute.addChildren([
  appLayoutRoute.addChildren([
    listenRoute,
    listenFeedRoute,
    listenFavoritesRoute,
    listenHistoryRoute,
    listenAliasRoute,
    radioRoute,
    radioShowRoute,
    scheduleRoute,
    discoverRoute,
    themesRoute,
    settingsRoute,
    settingsSectionRoute,
    feedRoute,
    onboardingRoute,
    adminRoute,
    adminActivityRoute,
    adminLogsRoute,
    adminModerationRoute,
    adminModerationTabRoute,
    adminBetaRoute,
    adminUsersRoute,
    adminRadioRoute,
    adminRadioSubmissionsRoute,
    adminRadioStationSuggestionsRoute,
    adminOrphanPagesRoute,
    adminOrphanPagesTabRoute,
    adminNewsRoute,
    adminSelectsRoute,
    adminStreamsRoute,
    adminSupportRoute,
    adminContentRoute,
    adminTopListsRoute,
    adminAnnouncementsRoute,
    adminStorageRoute,
    adminArtworkPresetsRoute,
    adminStorageUserRoute,
    adminFilesRoute,
    adminContentReportsRoute,
    adminFinancialRoute,
    adminGovernanceRoute,
    adminReportsRoute,
    adminFeatureRequestsRoute,
    adminGrantsRoute,
    adminGrantCycleRoute,
    adminAgmRoute,
    adminMissedShowsRoute,
    adminVendorsRoute,
    adminMapRoute,
    adminVenuesRoute,
    adminDiscoWidgetsRoute,
    adminStatusRoute,
    adminI18nRoute,
    libraryRoute,
    librarySoundsRoute,
    libraryReleasesRoute,
    libraryCollectionsRoute,
    libraryRecordingsRoute,
    libraryFavoritesRoute,
    libraryHistoryRoute,
    librarySmartLinksRoute,
    libraryMediaRoute,
    libraryLocalRoute,
    libraryMessagesRoute,
    messagesAliasRoute,
    messagesThreadRoute,
    favoritesRoute,
    historyRoute,
    sourcesRoute,
    sourcesTabRoute,
    venuesRoute,
    venuesRegisterRoute,
    venueDetailRoute,
    moreRoute,
    whatsNewRoute,
    newsRoute,
    channelRoute,
    prodChannelAliasRoute,
    artistRoute,
    jamRoute,
    collectionRoute,
    trackDetailRoute,
    prodSubscribeAliasRoute,
    smartLinkRoute,
    chatIndexRoute,
    chatSlugRoute,
    subscribeRoute,
    greenRoomRoute,
    transparencyRoute,
    transparencyGrantYearRoute,
    transparencyMethodologyRoute,
    helpRoute,
    helpSlugRoute,
    joinRoute,
    applyRoute,
    signupRoute,
    signupPaymentRoute,
    verifyRoute,
    setupPasswordRoute,
    forgotPasswordRoute,
    resetPasswordRoute,
    loginRoute,
    accountRoute,
    statusRoute,
    governanceRoute,
    publicGovernanceHistoryRoute,
    featureRequestsRoute,
    aboutRoute,
    whatIsItRoute,
    howItWorksRoute,
    forArtistsRoute,
    termsRoute,
    privacyRoute,
    agplRoute,
    studioRoute,
    studioSetupChannelRoute,
    studioGoLiveRoute,
    studioBroadcastInfoRoute,
    studioSoundsRoute,
    studioArchiveRedirectRoute,
    studioRecordingsRoute,
    studioSoundItemRoute,
    studioArchiveItemRedirectRoute,
    studioSoundEditorRoute,
    studioArchiveEditorRedirectRoute,
    studioMasteringRoute,
    studioReleasesRoute,
    studioReleaseDetailRoute,
    studioCollectionsRoute,
    studioCollectionEditRoute,
    studioUploadRoute,
    libraryUploadRoute,
    studioEditorRoute,
    studioEditorProjectRoute,
    studioStashRoute,
    studioScheduleRoute,
    studioStatsRoute,
    studioGovernanceRoute,
    studioStatsDetailRoute,
    studioChannelRoute,
    studioBrandingRoute,
    studioShowsRoute,
    studioShowDetailRoute,
    studioEpisodeRoute,
    studioPlaylistsRoute,
    studioPlaylistEditRoute,
    studioUpdatesRoute,
    studioRevenueRoute,
    studioStripeRoute,
    studioDistributionRoute,
    studioModerationRoute,
    studioVenuesRoute,
    studioEventsRoute,
    studioEventCreateRoute,
    studioInsightsIndexRoute,
    studioInsightsRoute,
    dashboardIndexAliasRoute,
    dashboardSplatAliasRoute,
  ]),
  embedChannelRoute,
  embedReleaseRoute,
  embedColRoute,
  embedUserColRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
