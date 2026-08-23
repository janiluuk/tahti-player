import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router';

import type { IntegrationId } from './api/sources';
import { SOURCE_DEFS } from './api/sources';
import { AppShell } from './components/AppShell';
import { diagnosticsEnabled } from './lib/buildPolicy';
import {
  appendSearchParams,
  resolveDashboardCallbackRedirect,
} from './lib/cutoverReturns';
import { resolveDashboardRedirect } from './lib/prodPathRedirects';
import { useAuthStore } from './stores/authStore';
import { AdminAgmView } from './views/admin/AdminAgmView';
import { AdminAnnouncementsView } from './views/admin/AdminAnnouncementsView';
import { AdminBetaView } from './views/admin/AdminBetaView';
import { AdminContentReportsView } from './views/admin/AdminContentReportsView';
import { AdminDashboardView } from './views/admin/AdminDashboardView';
import { AdminFeatureRequestsView } from './views/admin/AdminFeatureRequestsView';
import { AdminFilesView } from './views/admin/AdminFilesView';
import { AdminFinancialView } from './views/admin/AdminFinancialView';
import { AdminGovernanceView } from './views/admin/AdminGovernanceView';
import { AdminGrantsView } from './views/admin/AdminGrantsView';
import { AdminI18nView } from './views/admin/AdminI18nView';
import { AdminNewsView } from './views/admin/AdminNewsView';
import { AdminRadioSubmissionsView } from './views/admin/AdminRadioSubmissionsView';
import { AdminRadioView } from './views/admin/AdminRadioView';
import { AdminSelectsView } from './views/admin/AdminSelectsView';
import { AdminStatusView } from './views/admin/AdminStatusView';
import { AdminStorageView } from './views/admin/AdminStorageView';
import { AdminStreamsView } from './views/admin/AdminStreamsView';
import { AdminSupportView } from './views/admin/AdminSupportView';
import { AdminTopListsView } from './views/admin/AdminTopListsView';
import { AdminUsersView } from './views/admin/AdminUsersView';
import { AdminVendorsView } from './views/admin/AdminVendorsView';
import { ArtistView } from './views/ArtistView';
import { ChannelView } from './views/ChannelView';
import { ChatView } from './views/ChatView';
import { CollectionView } from './views/CollectionView';
import { DashboardAliasView } from './views/DashboardAliasView';
import {
  EmbedChannelView,
  EmbedCollectionView,
  EmbedReleaseView,
} from './views/EmbedViews';
import { FeedView } from './views/FeedView';
import { ForgotPasswordView } from './views/ForgotPasswordView';
import { GovernanceView } from './views/GovernanceView';
import { GreenRoomView } from './views/GreenRoomView';
import { HelpArticleView, HelpHubView } from './views/HelpView';
import { JoinView } from './views/JoinView';
import { LegalView } from './views/LegalView';
import { LibraryView } from './views/LibraryView';
import { ListenView } from './views/ListenView';
import { LoginView } from './views/LoginView';
import { MessagesView } from './views/MessagesView';
import { MoreView } from './views/MoreView';
import { OnboardingView } from './views/OnboardingView';
import { RadioShowView } from './views/RadioShowView';
import { RadioView } from './views/RadioView';
import { ResetPasswordView } from './views/ResetPasswordView';
import { SettingsView } from './views/settings/SettingsView';
import { SetupPasswordView } from './views/SetupPasswordView';
import { SignupPaymentView } from './views/SignupPaymentView';
import { SmartLinkView } from './views/SmartLinkView';
import { SourcesView } from './views/SourcesView';
import { StatusView } from './views/StatusView';
import { StudioArchiveItemView } from './views/studio/StudioArchiveItemView';
import { StudioArchiveView } from './views/studio/StudioArchiveView';
import { StudioBrandingView } from './views/studio/StudioBrandingView';
import { StudioChannelView } from './views/studio/StudioChannelView';
import { StudioCollectionEditView } from './views/studio/StudioCollectionEditView';
import { StudioCollectionsView } from './views/studio/StudioCollectionsView';
import { StudioDistributionView } from './views/studio/StudioDistributionView';
import { StudioEditorListView } from './views/studio/StudioEditorListView';
import { StudioEditorProjectView } from './views/studio/StudioEditorProjectView';
import { StudioEmbedsView } from './views/studio/StudioEmbedsView';
import { StudioEventsView } from './views/studio/StudioEventsView';
import { StudioGoLiveView } from './views/studio/StudioGoLiveView';
import { StudioHomeView } from './views/studio/StudioHomeView';
import { StudioModerationView } from './views/studio/StudioModerationView';
import { StudioPlaylistEditorView } from './views/studio/StudioPlaylistsView';
import { StudioProEditorView } from './views/studio/StudioProEditorView';
import { StudioRecordingsView } from './views/studio/StudioRecordingsView';
import { StudioReleaseDetailView } from './views/studio/StudioReleaseDetailView';
import { StudioReleasesView } from './views/studio/StudioReleasesView';
import { StudioRevenueView } from './views/studio/StudioRevenueView';
import { StudioScheduleView } from './views/studio/StudioScheduleView';
import {
  StudioEpisodeReviewView,
  StudioShowDetailView,
} from './views/studio/StudioShowDetailView';
import { StudioShowsView } from './views/studio/StudioShowsView';
import { StudioStashView } from './views/studio/StudioStashView';
import { StudioStatsDetailView } from './views/studio/StudioStatsDetailView';
import { StudioStatsView } from './views/studio/StudioStatsView';
import { StudioTrackInsightsView } from './views/studio/StudioTrackInsightsView';
import { StudioUpdatesView } from './views/studio/StudioUpdatesView';
import { StudioUploadView } from './views/studio/StudioUploadView';
import { StudioVenuesView } from './views/studio/StudioVenuesView';
import { SubscribeView } from './views/SubscribeView';
import { TransparencyView } from './views/TransparencyView';
import { VenueRegisterView } from './views/VenueRegisterView';
import { VenuesView } from './views/VenuesView';
import { VerifyView } from './views/VerifyView';
import { WhatsNewView } from './views/WhatsNewView';

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

const radioRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/radio',
  component: RadioView,
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

const adminBetaRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/beta',
  component: AdminBetaView,
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
  component: AdminRadioSubmissionsView,
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
  component: AdminSupportView,
});

const adminTopListsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/top-lists',
  component: AdminTopListsView,
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

const adminFilesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/files',
  component: AdminFilesView,
});

const adminContentReportsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/content-reports',
  component: AdminContentReportsView,
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

const adminFeatureRequestsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/feature-requests',
  component: AdminFeatureRequestsView,
});

const adminGrantsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/grants',
  component: AdminGrantsView,
});

const adminAgmRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/agm',
  component: AdminAgmView,
});

const adminVendorsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/vendors',
  component: AdminVendorsView,
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

const libraryRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library',
  component: () => <LibraryView tab="discography" />,
});

const libraryReleasesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/releases',
  component: () => <LibraryView tab="releases" />,
});

const libraryCollectionsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/collections',
  component: () => <LibraryView tab="collections" />,
});

const libraryRecordingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/recordings',
  component: () => <LibraryView tab="recordings" />,
});

const libraryFavoritesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/favorites',
  component: () => <LibraryView tab="favorites" />,
});

const libraryHistoryRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/history',
  component: () => <LibraryView tab="history" />,
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

const favoritesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/favorites',
  beforeLoad: () => {
    throw redirect({ to: '/library/favorites' });
  },
});

const historyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/history',
  beforeLoad: () => {
    throw redirect({ to: '/library/history' });
  },
});

const sourcesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sources',
  component: () => <SourcesView />,
});

const sourcesTabRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sources/$id',
  validateSearch: (search: Record<string, unknown>): { status?: string } => ({
    status: typeof search.status === 'string' ? search.status : undefined,
  }),
  component: function SourcesTabRoute() {
    const { id } = sourcesTabRoute.useParams();
    const known = SOURCE_DEFS.some((d) => d.id === id);
    return <SourcesView tabId={known ? (id as IntegrationId) : undefined} />;
  },
});

const venuesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/venues',
  component: VenuesView,
});

const venuesRegisterRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/venues/register',
  component: VenueRegisterView,
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

const channelRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/channel/$slug',
  validateSearch: (search: Record<string, unknown>): { edit?: string } => ({
    edit: typeof search.edit === 'string' ? search.edit : undefined,
  }),
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

const collectionRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/u/$username/c/$slug',
  component: function CollectionRoute() {
    const { username, slug } = collectionRoute.useParams();
    return <CollectionView username={username} slug={slug} />;
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

const aboutRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/about',
  component: () => <LegalView slug="about" />,
});

const whatIsItRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/what-is-it',
  component: () => <LegalView slug="what-is-it" />,
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
  component: () => <LegalView slug="terms" />,
});

const privacyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/privacy',
  component: () => <LegalView slug="privacy" />,
});

const agplRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/agpl',
  component: () => <LegalView slug="agpl" />,
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

const studioArchiveRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/archive',
  component: StudioArchiveView,
});

const studioRecordingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/recordings',
  component: StudioRecordingsView,
});

const studioArchiveItemRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/archive/$id',
  component: function StudioArchiveItemRoute() {
    const { id } = studioArchiveItemRoute.useParams();
    return <StudioArchiveItemView id={id} />;
  },
});

const studioArchiveEditorRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/archive/$id/editor',
  component: function StudioArchiveEditorRoute() {
    const { id } = studioArchiveEditorRoute.useParams();
    return <StudioProEditorView archiveItemId={id} />;
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

const studioStatsDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/stats/detail',
  component: StudioStatsDetailView,
});

const studioSetupChannelRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/setup-channel',
  beforeLoad: () => {
    throw redirect({ to: '/studio/channel', search: { tab: 'setup' } });
  },
});

const studioChannelRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/channel',
  component: StudioChannelView,
});

const studioBrandingRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/branding',
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

const studioDistributionRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/distribution',
  component: StudioDistributionView,
});

const studioModerationRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/moderation',
  component: StudioModerationView,
});

const studioVenuesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/venues',
  component: StudioVenuesView,
});

const studioEventsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/events',
  component: StudioEventsView,
});

const studioEmbedsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/embeds',
  component: StudioEmbedsView,
});

const studioInsightsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/insights/$kind/$id',
  component: function StudioInsightsRoute() {
    const { kind, id } = studioInsightsRoute.useParams();
    return (
      <StudioTrackInsightsView
        kind={kind === 'release-tracks' ? 'release-tracks' : 'archive'}
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
    listenAliasRoute,
    radioRoute,
    radioShowRoute,
    themesRoute,
    settingsRoute,
    settingsSectionRoute,
    feedRoute,
    onboardingRoute,
    adminRoute,
    adminBetaRoute,
    adminUsersRoute,
    adminRadioRoute,
    adminRadioSubmissionsRoute,
    adminNewsRoute,
    adminSelectsRoute,
    adminStreamsRoute,
    adminSupportRoute,
    adminTopListsRoute,
    adminAnnouncementsRoute,
    adminStorageRoute,
    adminFilesRoute,
    adminContentReportsRoute,
    adminFinancialRoute,
    adminGovernanceRoute,
    adminFeatureRequestsRoute,
    adminGrantsRoute,
    adminAgmRoute,
    adminVendorsRoute,
    adminStatusRoute,
    adminI18nRoute,
    libraryRoute,
    libraryReleasesRoute,
    libraryCollectionsRoute,
    libraryRecordingsRoute,
    libraryFavoritesRoute,
    libraryHistoryRoute,
    libraryMessagesRoute,
    messagesAliasRoute,
    favoritesRoute,
    historyRoute,
    sourcesRoute,
    sourcesTabRoute,
    venuesRoute,
    venuesRegisterRoute,
    moreRoute,
    whatsNewRoute,
    channelRoute,
    prodChannelAliasRoute,
    artistRoute,
    collectionRoute,
    prodSubscribeAliasRoute,
    smartLinkRoute,
    chatIndexRoute,
    chatSlugRoute,
    subscribeRoute,
    greenRoomRoute,
    transparencyRoute,
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
    studioArchiveRoute,
    studioRecordingsRoute,
    studioArchiveItemRoute,
    studioArchiveEditorRoute,
    studioReleasesRoute,
    studioReleaseDetailRoute,
    studioCollectionsRoute,
    studioCollectionEditRoute,
    studioUploadRoute,
    studioEditorRoute,
    studioEditorProjectRoute,
    studioStashRoute,
    studioScheduleRoute,
    studioStatsRoute,
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
    studioDistributionRoute,
    studioModerationRoute,
    studioVenuesRoute,
    studioEventsRoute,
    studioEmbedsRoute,
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
