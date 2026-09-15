import {
  createRoute,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router';

import { diagnosticsEnabled } from '../lib/buildPolicy';
import { ArtistView } from '../views/ArtistView';
import { ChannelView } from '../views/ChannelView';
import { ChatView } from '../views/ChatView';
import { CollectionView } from '../views/CollectionView';
import { FavoritesView } from '../views/FavoritesView';
import { GreenRoomView } from '../views/GreenRoomView';
import { JamView } from '../views/JamView';
import { MessagesView } from '../views/MessagesView';
import { NewsView } from '../views/NewsView';
import { SmartLinkView } from '../views/SmartLinkView';
import { SubscribeView } from '../views/SubscribeView';
import { TrackDetailView } from '../views/TrackDetailView';
import { VenueDetailView } from '../views/VenueDetailView';
import { VenueRegisterView } from '../views/VenueRegisterView';
import { WhatsNewView } from '../views/WhatsNewView';
import { appLayoutRoute } from './router-core';
import { MoreView, StudioCollectionEditView } from './router-lazy-views';

// Its History tab pulls in react-activity-calendar plus the other
// HistoryCharts components — keep that off the anonymous listen path's
// main bundle rather than loading it on every page.
const LibraryView = lazyRouteComponent(
  () => import('../views/LibraryView'),
  'LibraryView',
);

export const libraryRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library',
  component: () => <LibraryView tab="library" />,
});

export const librarySoundsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/sounds',
  component: () => <LibraryView tab="sounds" />,
});

export const libraryReleasesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/releases',
  beforeLoad: () => {
    throw redirect({ to: '/studio/releases' });
  },
});

/** `?tab=` sub-tabs are legacy bookmarks — each now has its own clean
 * `/library/<tab>` route, so old links redirect forward instead of
 * being rendered inline here. */
export const libraryCollectionsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/collections',
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    tab?: 'recordings' | 'media' | 'stash' | 'embeds';
  } => ({
    tab:
      search.tab === 'recordings' ||
      search.tab === 'media' ||
      search.tab === 'stash' ||
      search.tab === 'embeds'
        ? search.tab
        : undefined,
  }),
  beforeLoad: ({ search }) => {
    if (search.tab) {
      throw redirect({ to: `/library/${search.tab}` });
    }
  },
  component: () => <LibraryView tab="collections" />,
});

export const libraryCollectionEditRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/collections/$slug',
  component: function LibraryCollectionEditRoute() {
    const { slug } = libraryCollectionEditRoute.useParams();
    return <StudioCollectionEditView slug={slug} nav="library" />;
  },
});

export const libraryRecordingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/recordings',
  component: () => <LibraryView tab="recordings" />,
});

export const libraryStashRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/stash',
  component: () => <LibraryView tab="stash" />,
});

export const libraryEmbedsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/embeds',
  component: () => <LibraryView tab="embeds" />,
});

export const libraryFavoritesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/favorites',
  beforeLoad: () => {
    throw redirect({ to: '/favorites' });
  },
});

export const libraryHistoryRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/history',
  beforeLoad: () => {
    throw redirect({ to: '/listen/history' });
  },
});

export const librarySmartLinksRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/smartlinks',
  component: () => <LibraryView tab="smartlinks" />,
});

export const libraryMediaRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/media',
  component: () => <LibraryView tab="media" />,
});

export const libraryLocalRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/local',
  component: () => <LibraryView tab="local" />,
});

export const libraryMessagesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/messages',
  beforeLoad: () => {
    throw redirect({ to: '/messages' });
  },
});

export const messagesAliasRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/messages',
  component: MessagesView,
});

export const messagesThreadRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/messages/$id',
  component: function MessagesThreadRoute() {
    const { id } = messagesThreadRoute.useParams();
    return <MessagesView threadId={id} />;
  },
});

export const favoritesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/favorites',
  component: FavoritesView,
});

export const historyRoute = createRoute({
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

export const sourcesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sources',
  beforeLoad: redirectToImportAddOns,
});

export const sourcesTabRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sources/$id',
  beforeLoad: redirectToImportAddOns,
});

export const venuesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/venues',
  beforeLoad: () => {
    throw redirect({ to: '/discover', search: { tab: 'venues' } });
  },
});

export const venuesRegisterRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/venues/register',
  component: VenueRegisterView,
});

export const venueDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/v/$slug',
  component: function VenueDetailRoute() {
    const { slug } = venueDetailRoute.useParams();
    return <VenueDetailView slug={slug} />;
  },
});

export const moreRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/more',
  beforeLoad: () => {
    if (!diagnosticsEnabled) {
      throw redirect({ to: '/' });
    }
  },
  component: MoreView,
});

export const whatsNewRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/whats-new',
  component: WhatsNewView,
});

export const newsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/news',
  component: NewsView,
});

export const channelRoute = createRoute({
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

export const artistRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/u/$username',
  component: function ArtistRoute() {
    const { username } = artistRoute.useParams();
    return <ArtistView username={username} />;
  },
});

export const jamRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/jam/$code',
  component: function JamRoute() {
    const { code } = jamRoute.useParams();
    return <JamView code={code} />;
  },
});

export const collectionRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/u/$username/c/$slug',
  component: function CollectionRoute() {
    const { slug } = collectionRoute.useParams();
    return <CollectionView slug={slug} />;
  },
});

export const trackDetailRoute = createRoute({
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

export const smartLinkRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/r/$slug',
  component: function SmartLinkRoute() {
    const { slug } = smartLinkRoute.useParams();
    return <SmartLinkView slug={slug} />;
  },
});

export const chatIndexRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/chat',
  component: () => <ChatView />,
});

export const chatSlugRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/chat/$slug',
  component: function ChatSlugRoute() {
    const { slug } = chatSlugRoute.useParams();
    return <ChatView slug={slug} />;
  },
});

export const subscribeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/subscribe/$username',
  component: function SubscribeRoute() {
    const { username } = subscribeRoute.useParams();
    return <SubscribeView username={username} />;
  },
});

export const greenRoomRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/u/$username/green-room',
  component: function GreenRoomRoute() {
    const { username } = greenRoomRoute.useParams();
    return <GreenRoomView username={username} />;
  },
});
