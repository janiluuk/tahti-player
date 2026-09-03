import { getStudioPrimaryRoute } from '../components/StudioNav';
import { matchesSectionRoute } from './sectionNavigation';

export type SidebarItemId =
  | 'listen'
  | 'radio'
  | 'discover'
  | 'favorites'
  | 'studio'
  | 'perform'
  | 'admin'
  | 'help';

export type MobileItemId =
  | 'listen'
  | 'radio'
  | 'discover'
  | 'library'
  | 'studio';

export type ListenTabId = 'listen' | 'feed' | 'favorites' | 'history';

export function locationPathname(location: string | undefined): string {
  return location?.split('?')[0] ?? '';
}

/** Desktop sidebar: exactly one item, or null when the route is contextual. */
export function activeSidebarItem(
  location: string | undefined,
): SidebarItemId | null {
  const path = locationPathname(location);
  if (
    path === '/listen/favorites' ||
    path.startsWith('/library/favorites') ||
    path === '/favorites'
  ) {
    return 'favorites';
  }
  if (matchesSectionRoute(path, ['/radio'])) {
    return 'radio';
  }
  if (matchesSectionRoute(path, ['/discover'])) {
    return 'discover';
  }
  const studioSection = getStudioPrimaryRoute(path);
  if (studioSection === '/studio/go-live') {
    return 'perform';
  }
  if (studioSection === '/studio') {
    return 'studio';
  }
  if (matchesSectionRoute(path, ['/admin'])) {
    return 'admin';
  }
  if (matchesSectionRoute(path, ['/help'])) {
    return 'help';
  }
  if (isListenSidebarRoute(path)) {
    return 'listen';
  }
  return null;
}

/** Phone bottom bar has no Favorites entry — those routes stay on Listen. */
export function activeMobileItem(
  location: string | undefined,
): MobileItemId | null {
  const path = locationPathname(location);
  if (matchesSectionRoute(path, ['/radio'])) {
    return 'radio';
  }
  if (matchesSectionRoute(path, ['/discover'])) {
    return 'discover';
  }
  if (matchesSectionRoute(path, ['/library'])) {
    return 'library';
  }
  if (getStudioPrimaryRoute(path) === '/studio/go-live') {
    return 'studio';
  }
  if (getStudioPrimaryRoute(path) === '/studio') {
    return 'studio';
  }
  if (isFavoritesRoute(path) || isListenSidebarRoute(path)) {
    return 'listen';
  }
  return null;
}

export function activeListenTab(
  location: string | undefined,
): ListenTabId | null {
  const path = locationPathname(location);
  if (path === '/listen/feed' || path === '/feed') {
    return 'feed';
  }
  if (isFavoritesRoute(path)) {
    return 'favorites';
  }
  if (path === '/listen/history' || path === '/history') {
    return 'history';
  }
  if (path === '/' || path === '/listen') {
    return 'listen';
  }
  return null;
}

function isFavoritesRoute(path: string): boolean {
  return (
    path === '/listen/favorites' ||
    path.startsWith('/library/favorites') ||
    path === '/favorites'
  );
}

function isListenSidebarRoute(path: string): boolean {
  return (
    path === '/' ||
    path === '/listen' ||
    path === '/listen/feed' ||
    path === '/listen/history' ||
    path === '/feed' ||
    path === '/history' ||
    path.startsWith('/channel/') ||
    path.startsWith('/chat') ||
    path.startsWith('/t/') ||
    path.startsWith('/r/') ||
    path.startsWith('/c/')
  );
}

export const SIDEBAR_UNLIT_INTENTIONAL: readonly string[] = [
  '/login',
  '/join',
  '/apply',
  '/signup',
  '/verify',
  '/forgot-password',
  '/reset-password',
  '/setup-password',
  '/onboarding',
  '/about',
  '/privacy',
  '/terms',
  '/agpl',
  '/what-is-it',
  '/how-it-works',
  '/for-artists',
  '/status',
  '/news',
  '/whats-new',
  '/transparency',
  '/governance',
  '/venues',
  '/schedule',
  '/messages',
  '/account',
  '/settings',
];
