import { test } from '@playwright/test';

import { signIn } from './helpers/auth';
import {
  collectPageErrors,
  expectRouteHealthy,
  type RouteVisit,
} from './helpers/routeHealth';

const libraryRoutes: RouteVisit[] = [
  { path: '/library/sounds', heading: /^Sounds$/ },
  { path: '/library/collections', heading: /^Collections$/ },
  { path: '/library/recordings', heading: /^Recordings$/ },
  { path: '/library/stash', heading: /^Stash$/ },
  { path: '/library/embeds', heading: /^Embeds$/ },
  { path: '/library/smartlinks', heading: /^Smart links$/ },
  { path: '/library/media', heading: /^Media$/ },
  {
    path: '/library/favorites',
    heading: /^Favorites$/,
  },
  {
    path: '/library/history',
    heading: /^History$/,
    url: /\/listen\/history$/,
  },
  // The local-files tab exists only in the desktop app; on the web it
  // falls back to the library overview instead of an empty tab.
  { path: '/library/local', heading: 'Library overview', url: /\/library$/ },
];

test('library tabs and their aliases render for a signed-in artist', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await signIn(page);

  for (const route of libraryRoutes) {
    await expectRouteHealthy(page, errors, route);
  }
});
