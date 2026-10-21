import { createRoute } from '@tanstack/react-router';

import { appLayoutRoute } from './router-core';
import {
  AgplView,
  LegalView,
  PrivacyView,
  TermsView,
  WhatIsItView,
} from './router-lazy-views';

export const aboutRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/about',
  component: () => <LegalView slug="about" />,
});

export const whatIsItRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/what-is-it',
  component: WhatIsItView,
});

export const howItWorksRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/how-it-works',
  component: () => <LegalView slug="how-it-works" />,
});

export const forArtistsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/for-artists',
  component: () => <LegalView slug="for-artists" />,
});

export const termsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/terms',
  component: TermsView,
});

export const privacyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/privacy',
  component: PrivacyView,
});

export const agplRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/agpl',
  component: AgplView,
});
