import { lazyRouteComponent } from '@tanstack/react-router';

export const StudioSoundView = lazyRouteComponent(
  () => import('../views/studio/StudioSoundView'),
  'StudioSoundView',
);
export const StudioCollectionEditView = lazyRouteComponent(
  () => import('../views/studio/StudioCollectionEditView'),
  'StudioCollectionEditView',
);
export const StudioDistributionView = lazyRouteComponent(
  () => import('../views/studio/StudioDistributionView'),
  'StudioDistributionView',
);
export const StudioProEditorView = lazyRouteComponent(
  () => import('../views/studio/StudioProEditorView'),
  'StudioProEditorView',
);
export const StudioMasteringView = lazyRouteComponent(
  () => import('../views/studio/StudioMasteringView'),
  'StudioMasteringView',
);
export const StudioShowDetailView = lazyRouteComponent(
  () => import('../views/studio/StudioShowDetailView'),
  'StudioShowDetailView',
);
export const StudioEpisodeReviewView = lazyRouteComponent(
  () => import('../views/studio/StudioShowDetailView'),
  'StudioEpisodeReviewView',
);
export const MoreView = lazyRouteComponent(
  () => import('../views/MoreView'),
  'MoreView',
);
export const FeatureRequestsView = lazyRouteComponent(
  () => import('../views/FeatureRequestsView'),
  'FeatureRequestsView',
);
export const GovernanceView = lazyRouteComponent(
  () => import('../views/GovernanceView'),
  'GovernanceView',
);
export const GovernanceMotionDetailView = lazyRouteComponent(
  () => import('../views/GovernanceMotionDetailView'),
  'GovernanceMotionDetailView',
);
export const GovernanceMembersView = lazyRouteComponent(
  () => import('../views/GovernanceMembersView'),
  'GovernanceMembersView',
);
export const GovernanceMeetingDetailView = lazyRouteComponent(
  () => import('../views/GovernanceMeetingDetailView'),
  'GovernanceMeetingDetailView',
);
export const PublicGovernanceHistoryView = lazyRouteComponent(
  () => import('../views/PublicGovernanceHistoryView'),
  'PublicGovernanceHistoryView',
);
export const HelpArticleView = lazyRouteComponent(
  () => import('../views/HelpView'),
  'HelpArticleView',
);
export const HelpHubView = lazyRouteComponent(
  () => import('../views/HelpView'),
  'HelpHubView',
);
export const LegalView = lazyRouteComponent(
  () => import('../views/LegalView'),
  'LegalView',
);
export const WhatIsItView = lazyRouteComponent(
  () => import('../views/WhatIsItView'),
  'WhatIsItView',
);
export const StatusView = lazyRouteComponent(
  () => import('../views/StatusView'),
  'StatusView',
);
export const TransparencyMethodologyView = lazyRouteComponent(
  () => import('../views/TransparencyMethodologyView'),
  'TransparencyMethodologyView',
);
export const TransparencyView = lazyRouteComponent(
  () => import('../views/TransparencyView'),
  'TransparencyView',
);
export const TransparencyResolutionsView = lazyRouteComponent(
  () => import('../views/TransparencyResolutionsView'),
  'TransparencyResolutionsView',
);
export const TransparencyGrantYearView = lazyRouteComponent(
  () => import('../views/TransparencyGrantYearView'),
  'TransparencyGrantYearView',
);
export const SettingsView = lazyRouteComponent(
  () => import('../views/settings/SettingsView'),
  'SettingsView',
);
export const AdminLogsView = lazyRouteComponent(
  () => import('../views/admin/AdminLogsView'),
  'AdminLogsView',
);
export const AdminAnnouncementsView = lazyRouteComponent(
  () => import('../views/admin/AdminAnnouncementsView'),
  'AdminAnnouncementsView',
);
export const AdminDashboardView = lazyRouteComponent(
  () => import('../views/admin/AdminDashboardView'),
  'AdminDashboardView',
);
export const AdminFinancialView = lazyRouteComponent(
  () => import('../views/admin/AdminFinancialView'),
  'AdminFinancialView',
);
export const AdminGovernanceView = lazyRouteComponent(
  () => import('../views/admin/AdminGovernanceView'),
  'AdminGovernanceView',
);
export const AdminGrantCycleView = lazyRouteComponent(
  () => import('../views/admin/AdminGrantCycleView'),
  'AdminGrantCycleView',
);
export const AdminI18nView = lazyRouteComponent(
  () => import('../views/admin/AdminI18nView'),
  'AdminI18nView',
);
export const AdminNewsView = lazyRouteComponent(
  () => import('../views/admin/AdminNewsView'),
  'AdminNewsView',
);
export const AdminModerationView = lazyRouteComponent(
  () => import('../views/admin/moderation/AdminModerationView'),
  'AdminModerationView',
);
export const AdminOrphanPagesView = lazyRouteComponent(
  () => import('../views/admin/orphanPages/AdminOrphanPagesView'),
  'AdminOrphanPagesView',
);
export const AdminRadioView = lazyRouteComponent(
  () => import('../views/admin/AdminRadioView'),
  'AdminRadioView',
);
export const AdminStatusView = lazyRouteComponent(
  () => import('../views/admin/AdminStatusView'),
  'AdminStatusView',
);
export const AdminVendorsView = lazyRouteComponent(
  () => import('../views/admin/AdminVendorsView'),
  'AdminVendorsView',
);
export const AdminMapView = lazyRouteComponent(
  () => import('../views/admin/AdminMapView'),
  'AdminMapView',
);
export const AdminStorageView = lazyRouteComponent(
  () => import('../views/admin/AdminStorageView'),
  'AdminStorageView',
);
export const AdminStorageUserView = lazyRouteComponent(
  () => import('../views/admin/AdminStorageUserView'),
  'AdminStorageUserView',
);
export const AdminArtworkPresetsView = lazyRouteComponent(
  () => import('../views/admin/AdminArtworkPresetsView'),
  'AdminArtworkPresetsView',
);
export const AdminStreamsView = lazyRouteComponent(
  () => import('../views/admin/AdminStreamsView'),
  'AdminStreamsView',
);
export const AdminSelectsView = lazyRouteComponent(
  () => import('../views/admin/AdminSelectsView'),
  'AdminSelectsView',
);
export const AdminTopListsView = lazyRouteComponent(
  () => import('../views/admin/AdminTopListsView'),
  'AdminTopListsView',
);
export const AdminContentView = lazyRouteComponent(
  () => import('../views/admin/AdminContentView'),
  'AdminContentView',
);
export const AdminUsersView = lazyRouteComponent(
  () => import('../views/admin/AdminUsersView'),
  'AdminUsersView',
);
export const AdminVenuesView = lazyRouteComponent(
  () => import('../views/admin/AdminVenuesView'),
  'AdminVenuesView',
);
export const AdminAddonsView = lazyRouteComponent(
  () => import('../views/admin/AdminAddonsView'),
  'AdminAddonsView',
);
export const StudioEventCreateView = lazyRouteComponent(
  () => import('../views/studio/StudioEventCreateView'),
  'StudioEventCreateView',
);
export const StudioGovernanceView = lazyRouteComponent(
  () => import('../views/studio/StudioGovernanceView'),
  'StudioGovernanceView',
);
export const StudioRevenueView = lazyRouteComponent(
  () => import('../views/studio/StudioRevenueView'),
  'StudioRevenueView',
);
export const StudioStripeView = lazyRouteComponent(
  () => import('../views/studio/StudioStripeView'),
  'StudioStripeView',
);
export const StudioTrackInsightsView = lazyRouteComponent(
  () => import('../views/studio/StudioTrackInsightsView'),
  'StudioTrackInsightsView',
);
export const StudioUpdatesView = lazyRouteComponent(
  () => import('../views/studio/StudioUpdatesView'),
  'StudioUpdatesView',
);
