import { createRoute, redirect } from '@tanstack/react-router';

import { parseDiscoverSearch } from '../lib/discoverTabs';
import { DiscoverView } from '../views/DiscoverView';
import { ListenView } from '../views/ListenView';
import { RadioScheduleView } from '../views/RadioScheduleView';
import { RadioShowView } from '../views/RadioShowView';
import { RadioView } from '../views/RadioView';
import { appLayoutRoute } from './router-core';

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

export const themesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/themes',
  beforeLoad: () => {
    throw redirect({ to: '/settings/$section', params: { section: 'themes' } });
  },
});
