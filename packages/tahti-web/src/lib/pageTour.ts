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

const SIDEBAR_STEPS: TourStep[] = [
  {
    id: 'nav-listen',
    label: 'Listen',
    description:
      'Browse the channel directory and see who’s live right now — the front page of Tahti.',
  },
  {
    id: 'nav-radio',
    label: 'Radio',
    description:
      'Tahti Radio — the shared 24/7 member relay, plus its schedule.',
  },
  {
    id: 'nav-feed',
    label: 'Feed',
    description: 'Updates and posts from the artists and channels you follow.',
  },
  {
    id: 'nav-discover',
    label: 'Discover',
    description: 'Find new artists and channels beyond who you already follow.',
  },
  {
    id: 'nav-library',
    label: 'My Library',
    description: 'Your sounds, collections, playlists, and listening history.',
  },
  {
    id: 'nav-messages',
    label: 'Messages',
    description: 'Direct messages with artists and other listeners.',
  },
  {
    id: 'nav-studio',
    label: 'Studio',
    description:
      'Your artist workspace — broadcasting, uploads, releases, and channel tools.',
  },
  {
    id: 'nav-admin',
    label: 'Admin',
    description: 'Board tools for moderating and running the platform.',
  },
  {
    id: 'nav-more',
    label: 'More',
    description: 'Feature map and screen atlas — what exists and where.',
  },
  {
    id: 'nav-settings',
    label: 'Settings',
    description: 'Account, artist, notification, and appearance preferences.',
  },
];

const TOPBAR_STEPS: TourStep[] = [
  {
    id: 'topbar-schedule',
    label: 'Radio schedule',
    description: 'See what’s coming up next on Tahti Radio.',
  },
  {
    id: 'topbar-golive',
    label: 'Broadcast',
    description: 'Jump straight to starting a broadcast on your channel.',
  },
  {
    id: 'topbar-upload',
    label: 'Upload',
    description: 'Add a new track or release to your library.',
  },
  {
    id: 'topbar-messages',
    label: 'Messages',
    description: 'Open your direct message inbox.',
  },
  {
    id: 'topbar-account',
    label: 'Account menu',
    description: 'Switch to your artist panel, open your channel, or log out.',
  },
  {
    id: 'topbar-login',
    label: 'Log in',
    description: 'Sign in to follow artists, chat, and use Studio tools.',
  },
];

const REVENUE_PAGE_STEPS: TourStep[] = [
  {
    id: 'revenue-stats',
    label: 'Order statistics',
    description:
      'Active subscribers, this month’s net, year-to-date payouts, and pending orders — the same numbers as production Studio → Revenue.',
  },
  {
    id: 'revenue-orders',
    label: 'Payout history',
    description:
      'Recent fan-sub charges and distribution royalty rows in one dated list (newest first, up to twelve).',
  },
  {
    id: 'revenue-flow',
    label: 'Order flow',
    description:
      'A typical €5 order: provider processing, Tahti’s 2% operational fee, then the rest to you.',
  },
  {
    id: 'revenue-help',
    label: 'Earnings guide',
    description:
      'Open the Help center article for the full money flow, grants, and what happens when a fan cancels.',
  },
  {
    id: 'revenue-connect',
    label: 'Stripe dashboard',
    description:
      'When Stripe is enabled, open the Studio Stripe dashboard for Connect status and the Express payout account.',
  },
];

const STRIPE_PAGE_STEPS: TourStep[] = [
  {
    id: 'stripe-status',
    label: 'Payout account',
    description:
      'Whether Stripe is on, your Connect account exists, and payments are ready.',
  },
  {
    id: 'stripe-actions',
    label: 'Express dashboard',
    description:
      'Finish onboarding or open Stripe’s Express dashboard for this payout account.',
  },
  {
    id: 'stripe-charges',
    label: 'Stripe charges',
    description:
      'Fan-sub orders processed through this Stripe account — the same money as Audience, without grants.',
  },
];

/** Longest-prefix match for page-purpose annotations. */
const PAGE_PURPOSE_BY_PREFIX: Array<{
  prefix: string;
  label: string;
  description: string;
}> = [
  {
    prefix: '/studio/audience',
    label: 'Audience overview',
    description:
      'Fan-sub stats, recent orders, and earnings flow for your channel — tiers and Stripe live under the same Studio Audience tab.',
  },
  {
    prefix: '/studio/stripe',
    label: 'Stripe payouts',
    description:
      'Connect status and Express dashboard for receiving fan-sub payouts.',
  },
  {
    prefix: '/studio/shows',
    label: 'Shows & schedule',
    description:
      'Plan upcoming broadcasts, edit the next show, and manage your channel schedule.',
  },
  {
    prefix: '/studio/go-live',
    label: 'Go live',
    description: 'Start or prepare a live broadcast on your channel.',
  },
  {
    prefix: '/studio/upload',
    label: 'Upload',
    description: 'Add new sounds and releases to your library.',
  },
  {
    prefix: '/studio',
    label: 'Studio',
    description:
      'Your artist workspace — broadcasting, library, channel tools, and audience.',
  },
  {
    prefix: '/library/sounds',
    label: 'Sounds',
    description: 'Your uploaded tracks and encoding status.',
  },
  {
    prefix: '/library',
    label: 'Library',
    description:
      'Your sounds, releases, collections, recordings, and listening history.',
  },
  {
    prefix: '/admin',
    label: 'Admin',
    description: 'Board tools for moderating users, content, and platform ops.',
  },
  {
    prefix: '/messages',
    label: 'Messages',
    description: 'Direct messages with artists and other listeners.',
  },
  {
    prefix: '/radio',
    label: 'Tahti Radio',
    description: 'The shared 24/7 member relay and its schedule.',
  },
  {
    prefix: '/discover',
    label: 'Discover',
    description: 'Find new artists and channels beyond who you already follow.',
  },
  {
    prefix: '/settings',
    label: 'Settings',
    description: 'Account, artist, notification, and appearance preferences.',
  },
  {
    prefix: '/feed',
    label: 'Feed',
    description: 'Updates and posts from artists and channels you follow.',
  },
  {
    prefix: '/',
    label: 'Home',
    description:
      'The front page of Tahti — who’s live, the channel directory, and shortcuts into Listen, Radio, and Studio.',
  },
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
    label: match.label,
    description: match.description,
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
  const steps: TourStep[] = [];
  if (pathname === '/studio/audience' || pathname === '/studio/revenue') {
    steps.push(...REVENUE_PAGE_STEPS);
  }
  if (pathname === '/studio/stripe') {
    steps.push(...STRIPE_PAGE_STEPS);
  }
  return steps;
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
    return dedupeById([purpose, ...SIDEBAR_STEPS, ...TOPBAR_STEPS]);
  }

  return dedupeById([purpose, ...pageFunctionalitySteps(pathname)]);
}
