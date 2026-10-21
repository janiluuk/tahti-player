import { createRoute } from '@tanstack/react-router';

import { appLayoutRoute } from './router-core';
import {
  FeatureRequestsView,
  GovernanceMeetingDetailView,
  GovernanceMembersView,
  GovernanceMotionDetailView,
  GovernanceView,
  PublicGovernanceHistoryView,
} from './router-lazy-views';

export const governanceRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/governance',
  component: GovernanceView,
});

export const governanceMembersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/governance/members',
  component: GovernanceMembersView,
});

export const governanceMeetingDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/governance/meetings/$id',
  component: function GovernanceMeetingDetailRoute() {
    const { id } = governanceMeetingDetailRoute.useParams();
    return <GovernanceMeetingDetailView id={id} />;
  },
});

export const governanceMotionDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/governance/motions/$id',
  component: function GovernanceMotionDetailRoute() {
    const { id } = governanceMotionDetailRoute.useParams();
    return <GovernanceMotionDetailView id={id} />;
  },
});

export const publicGovernanceHistoryRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/governance/history',
  component: PublicGovernanceHistoryView,
});

export const featureRequestsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/governance/feature-requests',
  component: FeatureRequestsView,
});
