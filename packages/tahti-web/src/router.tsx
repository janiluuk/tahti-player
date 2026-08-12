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
import { ArtistView } from './views/ArtistView';
import { ChannelView } from './views/ChannelView';
import { ChatView } from './views/ChatView';
import { CollectionView } from './views/CollectionView';
import {
  EmbedChannelView,
  EmbedCollectionView,
  EmbedReleaseView,
} from './views/EmbedViews';
import { GovernanceView } from './views/GovernanceView';
import { HelpArticleView, HelpHubView } from './views/HelpView';
import { JoinView } from './views/JoinView';
import { LegalView } from './views/LegalView';
import { LibraryView } from './views/LibraryView';
import { ListenView } from './views/ListenView';
import { LoginView } from './views/LoginView';
import { MoreView } from './views/MoreView';
import { RadioView } from './views/RadioView';
import { SettingsView } from './views/settings/SettingsView';
import { SmartLinkView } from './views/SmartLinkView';
import { SourcesView } from './views/SourcesView';
import { StatusView } from './views/StatusView';
import { StudioArchiveItemView } from './views/studio/StudioArchiveItemView';
import { StudioArchiveView } from './views/studio/StudioArchiveView';
import { StudioChannelView } from './views/studio/StudioChannelView';
import { StudioCollectionEditView } from './views/studio/StudioCollectionEditView';
import { StudioCollectionsView } from './views/studio/StudioCollectionsView';
import { StudioEditorListView } from './views/studio/StudioEditorListView';
import { StudioEditorProjectView } from './views/studio/StudioEditorProjectView';
import { StudioGoLiveView } from './views/studio/StudioGoLiveView';
import { StudioHomeView } from './views/studio/StudioHomeView';
import { StudioProEditorView } from './views/studio/StudioProEditorView';
import { StudioReleaseDetailView } from './views/studio/StudioReleaseDetailView';
import { StudioReleasesView } from './views/studio/StudioReleasesView';
import { StudioRevenueView } from './views/studio/StudioRevenueView';
import { StudioScheduleView } from './views/studio/StudioScheduleView';
import { StudioStashView } from './views/studio/StudioStashView';
import { StudioStatsDetailView } from './views/studio/StudioStatsDetailView';
import { StudioStatsView } from './views/studio/StudioStatsView';
import { StudioUpdatesView } from './views/studio/StudioUpdatesView';
import { StudioUploadView } from './views/studio/StudioUploadView';
import { SubscribeView } from './views/SubscribeView';
import { TransparencyView } from './views/TransparencyView';
import { VenuesView } from './views/VenuesView';
import { VerifyView } from './views/VerifyView';

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

const libraryRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library',
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
  component: () => <LibraryView tab="messages" />,
});

const messagesAliasRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/messages',
  beforeLoad: () => {
    throw redirect({ to: '/library/messages' });
  },
});

const favoritesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/favorites',
  beforeLoad: () => {
    throw redirect({ to: '/library' });
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

const moreRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/more',
  component: MoreView,
});

const channelRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/channel/$slug',
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

const verifyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/verify',
  component: VerifyView,
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

const studioChannelRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/channel',
  component: StudioChannelView,
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

const routeTree = rootRoute.addChildren([
  appLayoutRoute.addChildren([
    listenRoute,
    radioRoute,
    themesRoute,
    settingsRoute,
    settingsSectionRoute,
    libraryRoute,
    libraryHistoryRoute,
    libraryMessagesRoute,
    messagesAliasRoute,
    favoritesRoute,
    historyRoute,
    sourcesRoute,
    sourcesTabRoute,
    venuesRoute,
    moreRoute,
    channelRoute,
    artistRoute,
    collectionRoute,
    smartLinkRoute,
    chatIndexRoute,
    chatSlugRoute,
    subscribeRoute,
    transparencyRoute,
    helpRoute,
    helpSlugRoute,
    joinRoute,
    verifyRoute,
    loginRoute,
    accountRoute,
    statusRoute,
    governanceRoute,
    aboutRoute,
    termsRoute,
    privacyRoute,
    agplRoute,
    studioRoute,
    studioGoLiveRoute,
    studioArchiveRoute,
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
    studioUpdatesRoute,
    studioRevenueRoute,
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
