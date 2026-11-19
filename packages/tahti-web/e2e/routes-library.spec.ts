import { test } from '@playwright/test';

import { signIn } from './helpers/auth';
import {
  collectPageErrors,
  expectRouteHealthy,
  type RouteVisit,
} from './helpers/routeHealth';

// Library catalog paths are bookmarks for Studio → Music pages and redirect there.
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
  {
    path: '/library/stash',
    heading: /^Files$/,
    url: /\/library\/files\?kind=stash$/,
  },
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
  { path: '/library/media', heading: /^Files$/, url: /\/library\/files$/ },
  { path: '/library/files', heading: /^Files$/ },
  {
    path: '/library/favorites',
    heading: /^Favorites$/,
  },
  {
    path: '/library/playlists',
    heading: /^Playlists$/,
  },
  { path: '/library/history', heading: /^History$/ },
  { path: '/library/following', heading: /^Following$/ },
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
