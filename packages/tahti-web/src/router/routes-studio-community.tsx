import { createRoute, redirect } from '@tanstack/react-router';

import { isScheduleEventTab, type ScheduleEventTab } from '../lib/scheduleTabs';
import { appLayoutRoute } from './router-core';
import {
  StudioEventCreateView,
  StudioEventView,
  StudioGroupDetailView,
  StudioGroupsView,
  StudioListeningPartyFormView,
} from './router-lazy-views';

export const studioEventsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/events',
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: ScheduleEventTab } =>
    isScheduleEventTab(search.tab) ? { tab: search.tab } : {},
  beforeLoad: ({ search }) => {
    throw redirect({
      to: '/studio/schedule',
      search: { show: 'events', ...(search.tab ? { tab: search.tab } : {}) },
    });
  },
});

export const studioEventCreateRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/events/new',
  component: StudioEventCreateView,
});

export const studioEventRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/events/$eventId',
  component: function StudioEventRoute() {
    const { eventId } = studioEventRoute.useParams();
    return <StudioEventView eventId={eventId} />;
  },
});

export const studioEventEditRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/events/$eventId/edit',
  component: function StudioEventEditRoute() {
    const { eventId } = studioEventEditRoute.useParams();
    return <StudioEventCreateView eventId={eventId} />;
  },
});

export const studioGroupsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/groups',
  component: StudioGroupsView,
});

export const studioGroupDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/groups/$slug',
  component: function StudioGroupDetailRoute() {
    const { slug } = studioGroupDetailRoute.useParams();
    return <StudioGroupDetailView slug={slug} />;
  },
});

export const studioListeningPartiesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/listening-parties',
  beforeLoad: () => {
    throw redirect({ to: '/studio/schedule', search: { show: 'parties' } });
  },
});

export const studioListeningPartyCreateRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/listening-parties/new',
  validateSearch: (
    search: Record<string, unknown>,
  ): { releaseId?: string } => ({
    releaseId:
      typeof search.releaseId === 'string' ? search.releaseId : undefined,
  }),
  component: function StudioListeningPartyCreateRoute() {
    const { releaseId } = studioListeningPartyCreateRoute.useSearch();
    return <StudioListeningPartyFormView releaseId={releaseId} />;
  },
});

export const studioListeningPartyEditRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/listening-parties/$partyId/edit',
  component: function StudioListeningPartyEditRoute() {
    const { partyId } = studioListeningPartyEditRoute.useParams();
    return <StudioListeningPartyFormView partyId={partyId} />;
  },
});
