import { test } from '@playwright/test';

import { signIn } from './helpers/auth';
import {
  collectPageErrors,
  expectRouteHealthy,
  type RouteVisit,
} from './helpers/routeHealth';

// The artist catalog moved to Studio → Music; its old Library links redirect.
const libraryRoutes: RouteVisit[] = [
  { path: '/library', heading: /^Favorites$/, url: /\/library\/favorites$/ },
  {
    path: '/library/sounds',
    heading: /^Sounds$/,
    url: /\/studio\/sounds$/,
  },
  {
    path: '/library/collections',
    heading: /^Collections$/,
    url: /\/studio\/collections$/,
  },
  {
    path: '/library/recordings',
    heading: /^Recordings$/,
    url: /\/studio\/recordings$/,
  },
  { path: '/library/stash', heading: /^Stash$/ },
  {
    path: '/library/embeds',
    heading: /^Sounds$/,
    url: /\/studio\/sounds\?tab=embeds/,
  },
  {
    path: '/library/smartlinks',
    heading: /^Smart links$/,
    url: /\/studio\/smartlinks$/,
  },
  { path: '/library/upload', heading: /^Upload$/, url: /\/studio\/upload$/ },
  { path: '/library/media', heading: /^Media$/ },
  {
    path: '/library/favorites',
    heading: /^Favorites$/,
  },
  { path: '/library/history', heading: /^History$/ },
  {
    path: '/library/following',
    heading: /^Artist$/,
    url: /\/settings\/artist\?tab=following/,
  },
  // The local-files tab exists only in the desktop app; on the web it
  // falls back to Favorites instead of an empty tab.
  {
    path: '/library/local',
    heading: /^Favorites$/,
    url: /\/library\/favorites$/,
  },
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
