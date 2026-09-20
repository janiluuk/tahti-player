import { createRoute } from '@tanstack/react-router';

import { appLayoutRoute } from './router-core';
import {
  TransparencyGrantYearView,
  TransparencyMethodologyView,
  TransparencyResolutionsView,
  TransparencyView,
} from './router-lazy-views';

export const transparencyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/transparency',
  component: TransparencyView,
});

export const transparencyResolutionsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/transparency/resolutions',
  component: TransparencyResolutionsView,
});

export const transparencyMethodologyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/transparency/methodology',
  component: TransparencyMethodologyView,
});

export const transparencyGrantYearRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/transparency/grants/$year',
  component: function TransparencyGrantYearRoute() {
    const { year } = transparencyGrantYearRoute.useParams();
    return <TransparencyGrantYearView year={Number(year)} />;
  },
});
