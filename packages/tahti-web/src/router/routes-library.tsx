import {
  createRoute,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router';

import { TAHTI_RADIO_SLUG } from '../api/client';
import { diagnosticsEnabled } from '../lib/buildPolicy';
import {
  fanCheckoutReturn,
  parseFanCheckoutReturnSearch,
} from '../lib/fanCheckoutReturn';
import { appLayoutRoute } from './router-core';
import {
  ArtistView,
  ChannelView,
  ChatView,
  CollectionView,
  GreenRoomView,
  GroupDetailView,
  GroupsDirectoryView,
  JamView,
  ListeningPartyView,
  MessagesView,
  ModerateChannelView,
  MoreView,
  MyVenuesView,
  NewsView,
  NotificationsView,
  SmartLinkView,
  StudioCollectionEditView,
  StudioCollectionsView,
  StudioSoundsView,
  SubscribeView,
  TrackDetailView,
  VenueDetailView,
  VenueRegisterView,
  WhatsNewView,
} from './router-lazy-views';

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
  validateSearch: (
    search: Record<string, unknown>,
  ): { contentType?: string; folder?: string } => ({
    contentType:
      typeof search.contentType === 'string' ? search.contentType : undefined,
    folder: typeof search.folder === 'string' ? search.folder : undefined,
  }),
  beforeLoad: ({ search }) => {
    if (search.folder === 'files') {
      throw redirect({ to: '/library/stash' });
    }
    if (search.folder === 'clips') {
      throw redirect({
        to: '/library/sounds',
        search: { contentType: 'CLIP' },
      });
    }
    if (search.folder === 'sound') {
      throw redirect({ to: '/library/sounds' });
    }
  },
  component: StudioSoundsView,
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
  component: StudioCollectionsView,
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
  component: () => <LibraryView tab="favorites" />,
});

export const libraryHistoryRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/history',
  component: () => <LibraryView tab="history" />,
});

export const libraryFollowingRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/following',
  beforeLoad: () => {
    throw redirect({
      to: '/settings/$section',
      params: { section: 'artist' },
      search: { tab: 'following' },
    });
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
  beforeLoad: async () => {
    const { getNativeLibrary } = await import('../lib/nativeLibrary');
    if (!getNativeLibrary()) {
      throw redirect({ to: '/library' });
    }
  },
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
  getParentRoute: () => messagesAliasRoute,
  path: '$id',
  component: () => null,
});

export const favoritesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/favorites',
  beforeLoad: () => {
    throw redirect({ to: '/library/favorites' });
  },
});

export const notificationsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/notifications',
  component: NotificationsView,
});

export const historyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/history',
  beforeLoad: () => {
    throw redirect({ to: '/listen/history' });
  },
});

function importAddOnsRedirect(
  search: Record<string, unknown>,
  provider?: string,
): never {
  const status = typeof search.status === 'string' ? search.status : null;
  throw redirect({
    to: '/settings/$section',
    params: { section: 'plugin-store' },
    search: {
      category: 'import',
      ...(status ? { status } : {}),
      ...(status && provider ? { provider } : {}),
    },
  });
}

export const sourcesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sources',
  beforeLoad: ({ search }) =>
    importAddOnsRedirect(search as Record<string, unknown>),
});

export const sourcesTabRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sources/$id',
  beforeLoad: ({ search, params }) =>
    importAddOnsRedirect(search as Record<string, unknown>, params.id),
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

export const myVenuesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/venues/mine',
  component: MyVenuesView,
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
  validateSearch: (
    search: Record<string, unknown>,
  ): { edit?: boolean; view?: 'channel' } => {
    const raw = search.edit;
    const view = search.view === 'channel' ? { view: 'channel' as const } : {};
    if (raw === true || raw === 1 || raw === '1' || raw === 'true') {
      return { edit: true, ...view };
    }
    return view;
  },
  beforeLoad: ({ params, search }) => {
    if (
      params.slug === TAHTI_RADIO_SLUG &&
      !search.edit &&
      search.view !== 'channel'
    ) {
      throw redirect({ to: '/radio', replace: true });
    }
  },
  component: function ChannelRoute() {
    const { slug } = channelRoute.useParams();
    return <ChannelView slug={slug} />;
  },
});

export const artistRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/u/$username',
  beforeLoad: ({ params }) => {
    if (params.username === TAHTI_RADIO_SLUG) {
      throw redirect({ to: '/radio', replace: true });
    }
  },
  component: function ArtistRoute() {
    const { username } = artistRoute.useParams();
    return <ArtistView username={username} />;
  },
});

export const groupsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/groups',
  component: GroupsDirectoryView,
});

export const groupDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/groups/$slug',
  component: function GroupDetailRoute() {
    const { slug } = groupDetailRoute.useParams();
    return <GroupDetailView slug={slug} />;
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

export const listeningPartyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/party/$id',
  component: function ListeningPartyRoute() {
    const { id } = listeningPartyRoute.useParams();
    return <ListeningPartyView id={id} />;
  },
});

export const moderateChannelRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/moderate/$slug',
  component: function ModerateChannelRoute() {
    const { slug } = moderateChannelRoute.useParams();
    return <ModerateChannelView slug={slug} />;
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
  validateSearch: parseFanCheckoutReturnSearch,
  component: function SubscribeRoute() {
    const { username } = subscribeRoute.useParams();
    const search = subscribeRoute.useSearch();
    return (
      <SubscribeView
        username={username}
        checkoutReturn={fanCheckoutReturn(search)}
      />
    );
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
