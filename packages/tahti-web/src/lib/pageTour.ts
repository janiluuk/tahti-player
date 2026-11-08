import { i18n } from '@tahti-player/i18n';

export type TourStep = {
  /** Matches a `data-tour-id` attribute on the element this step explains. */
  id: string;
  label: string;
  description: string;
  /**
   * When true, the tour card shows without a DOM cutout (used for page-purpose
   * annotations that explain the screen rather than a control).
   */
  annotationOnly?: boolean;
};

const camel = (id: string) =>
  id.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());

/** A step's text, read in the current language each time the tour opens. */
function tourStep(id: string): TourStep {
  const key = camel(id);
  return {
    id,
    label: i18n.t(`web:pageTour.steps.${key}.label` as never),
    description: i18n.t(`web:pageTour.steps.${key}.description` as never),
  };
}

const SIDEBAR_STEPS = [
  'nav-listen',
  'nav-radio',
  'nav-feed',
  'nav-discover',
  'nav-library',
  'nav-messages',
  'nav-studio',
  'nav-coop',
  'nav-admin',
  'nav-more',
  'nav-settings',
];

const TOPBAR_STEPS = [
  'topbar-schedule',
  'topbar-golive',
  'topbar-upload',
  'topbar-account',
  'topbar-login',
];

const REVENUE_PAGE_STEPS = [
  'revenue-stats',
  'revenue-orders',
  'revenue-flow',
  'revenue-help',
  'revenue-connect',
];

const DISCO_WIDGETS_STEP = 'disco-widgets';

/** Pages that can show Disco-widgets; the step is skipped where none render. */
function showsDiscoWidgets(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/listen' ||
    pathname.startsWith('/u/') ||
    pathname.startsWith('/channel/')
  );
}

const STRIPE_PAGE_STEPS = ['stripe-status', 'stripe-actions', 'stripe-charges'];

/** Longest-prefix match for page-purpose annotations. */
const PAGE_PURPOSE_BY_PREFIX: Array<{ prefix: string; key: string }> = [
  { prefix: '/studio/fans', key: 'studioFans' },
  { prefix: '/studio/audience', key: 'studioAudience' },
  { prefix: '/studio/profile', key: 'studioProfile' },
  { prefix: '/studio/stripe', key: 'studioStripe' },
  { prefix: '/studio/shows', key: 'studioShows' },
  { prefix: '/studio/broadcast', key: 'studioBroadcast' },
  { prefix: '/studio/go-live', key: 'studioGoLive' },
  { prefix: '/studio/upload', key: 'studioUpload' },
  { prefix: '/studio', key: 'studio' },
  { prefix: '/library/sounds', key: 'librarySounds' },
  { prefix: '/library', key: 'library' },
  { prefix: '/admin', key: 'admin' },
  { prefix: '/messages', key: 'messages' },
  { prefix: '/radio', key: 'radio' },
  { prefix: '/discover', key: 'discover' },
  { prefix: '/settings', key: 'settings' },
  { prefix: '/feed', key: 'feed' },
  { prefix: '/', key: 'home' },
];

function pagePurposeStep(pathname: string): TourStep {
  const match =
    PAGE_PURPOSE_BY_PREFIX.find((entry) =>
      entry.prefix === '/'
        ? pathname === '/'
        : pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`),
    ) ?? PAGE_PURPOSE_BY_PREFIX[PAGE_PURPOSE_BY_PREFIX.length - 1];

  return {
    id: 'page-purpose',
    label: i18n.t(`web:pageTour.purpose.${match.key}.label` as never),
    description: i18n.t(
      `web:pageTour.purpose.${match.key}.description` as never,
    ),
    annotationOnly: true,
  };
}

function dedupeById(steps: TourStep[]): TourStep[] {
  const seen = new Set<string>();
  return steps.filter((step) => {
    if (seen.has(step.id)) {
      return false;
    }
    seen.add(step.id);
    return true;
  });
}

function pageFunctionalitySteps(pathname: string): TourStep[] {
  const ids: string[] = [];
  if (pathname === '/studio/audience' || pathname === '/studio/revenue') {
    ids.push(...REVENUE_PAGE_STEPS);
  }
  if (pathname === '/studio/stripe') {
    ids.push(...STRIPE_PAGE_STEPS);
  }
  if (showsDiscoWidgets(pathname)) {
    ids.push(DISCO_WIDGETS_STEP);
  }
  return ids.map(tourStep);
}

/**
 * Steps for the current page's guided tour (H key).
 *
 * - Every page starts with a purpose annotation (what the screen is for).
 * - Shared chrome (sidebar, top bar, Studio/Admin section nav) only on `/`.
 * - Inner pages only add that page's own functionality steps.
 */
export function getPageTourSteps(pathname: string): TourStep[] {
  const purpose = pagePurposeStep(pathname);

  if (pathname === '/') {
    return dedupeById([
      purpose,
      ...SIDEBAR_STEPS.map(tourStep),
      ...TOPBAR_STEPS.map(tourStep),
      ...pageFunctionalitySteps(pathname),
    ]);
  }

  return dedupeById([purpose, ...pageFunctionalitySteps(pathname)]);
}
