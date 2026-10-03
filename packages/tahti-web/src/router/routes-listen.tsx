import { createRoute, redirect } from '@tanstack/react-router';

import { parseDiscoverSearch } from '../lib/discoverTabs';
import { ListenView } from '../views/ListenView';
import { appLayoutRoute } from './router-core';
import {
  DiscoverView,
  RadioScheduleView,
  RadioShowView,
  RadioStationView,
  RadioView,
  TagSearchView,
} from './router-lazy-views';

export const listenRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/',
  component: ListenView,
});

export const listenFeedRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/listen/feed',
  component: () => <ListenView tab="feed" />,
});

export const listenFavoritesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/listen/favorites',
  beforeLoad: () => {
    throw redirect({ to: '/favorites' });
  },
});

export const listenHistoryRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/listen/history',
  component: () => <ListenView tab="history" />,
});

export const radioRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/radio',
  component: RadioView,
});

export const discoverRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/discover',
  validateSearch: parseDiscoverSearch,
  component: DiscoverView,
});

export const tagSearchRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/search',
  validateSearch: (search: Record<string, unknown>): { tag?: string } => ({
    tag:
      typeof search.tag === 'string' && search.tag.trim()
        ? search.tag.trim()
        : undefined,
  }),
  component: function TagSearchRoute() {
    const { tag } = tagSearchRoute.useSearch();
    return <TagSearchView tag={tag} />;
  },
});

export const scheduleRoute = createRoute({
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

export const radioShowRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/radio/show/$channelSlug',
  component: () => {
    const { channelSlug } = radioShowRoute.useParams();
    return <RadioShowView channelSlug={channelSlug} />;
  },
});

export const radioStationRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/radio/station/$stationId',
  component: () => {
    const { stationId } = radioStationRoute.useParams();
    return <RadioStationView stationId={stationId} />;
  },
});

export const themesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/themes',
  beforeLoad: () => {
    throw redirect({ to: '/settings/$section', params: { section: 'themes' } });
  },
});
