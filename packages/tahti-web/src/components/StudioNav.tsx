import { useRouterState } from '@tanstack/react-router';
import {
  BarChart3Icon,
  BookOpenIcon,
  CalendarDaysIcon,
  CalendarIcon,
  CastIcon,
  CreditCardIcon,
  Disc3Icon,
  FileTextIcon,
  HeartIcon,
  KeyRoundIcon,
  LandmarkIcon,
  LayersIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  LightbulbIcon,
  ListMusicIcon,
  ListOrderedIcon,
  MicIcon,
  NewspaperIcon,
  RadioIcon,
  RadioTowerIcon,
  SendIcon,
  Settings2Icon,
  Share2Icon,
  SlidersHorizontalIcon,
  TrendingUpIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { SidebarNavigationItem } from '@tahti-player/ui';

import { useStripeConfigured } from '../hooks/useStripeConfigured';
import type { TourStep } from '../lib/pageTour';
import { matchesSectionRoute } from '../lib/sectionNavigation';
import {
  GO_LIVE_TAB_LABELS,
  GO_LIVE_TABS,
  goLiveTabPath,
  isGoLiveSessionRoute,
  isGoLiveSessionTabActive,
  type GoLiveTabId,
} from '../views/studio/go-live/goLiveTabs';
import { SectionTabs } from './SectionTabs';

type StudioSubmenuLabelKey =
  | (typeof SUBMENUS)[keyof typeof SUBMENUS][number]['labelKey']
  | 'studio.stripe'
  | 'studio.tiers';

type StudioSubmenuItem = {
  to: string;
  labelKey: StudioSubmenuLabelKey;
  icon: ReactNode;
};

const PRIMARY = [
  {
    to: '/studio',
    label: 'Studio',
    labelKey: 'nav.studio',
    description:
      'Your channel snapshot — status, quick links, and recent activity.',
    descriptionKey: 'studio.studioDescription',
    icon: <LayoutGridIcon size={16} aria-hidden />,
  },
] as const;

export const SUBMENUS = {
  '/studio': [
    {
      to: '/studio',
      labelKey: 'studio.overview',
      icon: <LayoutGridIcon size={16} />,
    },
    {
      to: '/studio/stats',
      labelKey: 'studio.stats',
      icon: <TrendingUpIcon size={16} />,
    },
    {
      to: '/studio/governance',
      labelKey: 'studio.governance',
      icon: <LandmarkIcon size={16} />,
    },
    {
      to: '/studio/updates',
      labelKey: 'studio.posts',
      icon: <NewspaperIcon size={16} />,
    },
    {
      to: '/studio/audience',
      labelKey: 'studio.audience',
      icon: <HeartIcon size={16} />,
    },
    {
      to: '/studio/releases',
      labelKey: 'studio.releases',
      icon: <ListMusicIcon size={16} />,
    },
    {
      to: '/studio/distribution',
      labelKey: 'studio.distribution',
      icon: <Share2Icon size={16} />,
    },
    {
      to: '/studio/editor',
      labelKey: 'studio.editor',
      icon: <SlidersHorizontalIcon size={16} />,
    },
    {
      to: '/studio/go-live',
      labelKey: 'studio.goLive',
      icon: <RadioTowerIcon size={16} />,
    },
  ],
} as const;

/** Perform used to be its own primary nav item with this submenu; it's now
 * folded into Studio as a single "Broadcast" tab (`studio.goLive` above),
 * and these pages get their own nested tab strip via `BroadcastSubNav`
 * instead of a second top-level Studio submenu section. */
export const BROADCAST_SUBNAV_ITEMS = [
  {
    to: '/studio/go-live',
    labelKey: 'studio.onAir' as const,
    icon: <RadioTowerIcon size={16} />,
  },
  {
    to: '/studio/schedule',
    labelKey: 'studio.schedule' as const,
    icon: <CalendarDaysIcon size={16} />,
  },
  {
    to: '/studio/events',
    labelKey: 'studio.events' as const,
    icon: <CalendarIcon size={16} />,
  },
  {
    to: '/studio/shows',
    labelKey: 'studio.shows' as const,
    icon: <MicIcon size={16} />,
  },
  {
    to: '/studio/channel',
    labelKey: 'studio.channel' as const,
    icon: <Settings2Icon size={16} />,
  },
  {
    to: '/studio/channel?tab=radio',
    labelKey: 'nav.radio' as const,
    icon: <RadioIcon size={16} />,
  },
] as const;

/** Audience used to grow a sibling "Stripe" Studio tab when Connect was
 * configured. Mirror Broadcast: one Studio "Audience" tab stays lit for the
 * whole group, and Overview / Tiers / Stripe live in `AudienceSubNav`. */
export const AUDIENCE_SUBNAV_ITEMS = [
  {
    to: '/studio/audience',
    labelKey: 'studio.overview' as const,
    icon: <LayoutGridIcon size={16} />,
  },
  {
    to: '/studio/audience?tab=tiers',
    labelKey: 'studio.tiers' as const,
    icon: <LayersIcon size={16} />,
  },
  {
    to: '/studio/stripe',
    labelKey: 'studio.stripe' as const,
    icon: <CreditCardIcon size={16} />,
    stripeOnly: true,
  },
] as const;

/** Stats, Governance and Posts keep their page tabs in `?tab=`, so they sit
 * in the same nested strip as Broadcast and Audience instead of in-page. */
export const STATS_SUBNAV_ITEMS = [
  {
    to: '/studio/stats',
    labelKey: 'studio.overview' as const,
    icon: <LayoutDashboardIcon size={16} />,
  },
  {
    to: '/studio/stats?tab=plays',
    labelKey: 'studio.playsListeners' as const,
    icon: <BarChart3Icon size={16} />,
  },
  {
    to: '/studio/stats?tab=top-lists',
    labelKey: 'studio.topLists' as const,
    icon: <ListOrderedIcon size={16} />,
  },
] as const;

export const GOVERNANCE_SUBNAV_ITEMS = [
  {
    to: '/studio/governance',
    labelKey: 'studio.motions' as const,
    icon: <LandmarkIcon size={16} />,
  },
  {
    to: '/studio/governance?tab=topics',
    labelKey: 'studio.topics' as const,
    icon: <LightbulbIcon size={16} />,
  },
  {
    to: '/studio/governance?tab=documents',
    labelKey: 'studio.documents' as const,
    icon: <FileTextIcon size={16} />,
  },
  {
    to: '/studio/governance?tab=guide',
    labelKey: 'studio.guide' as const,
    icon: <BookOpenIcon size={16} />,
  },
] as const;

export const UPDATES_SUBNAV_ITEMS = [
  {
    to: '/studio/updates',
    labelKey: 'studio.posts' as const,
    icon: <NewspaperIcon size={16} />,
  },
  {
    to: '/studio/updates?tab=newsletter',
    labelKey: 'studio.newsletter' as const,
    icon: <SendIcon size={16} />,
  },
] as const;

const TAB_SUBNAV_GROUPS = [
  { path: '/studio/stats', label: 'Stats pages', items: STATS_SUBNAV_ITEMS },
  {
    path: '/studio/governance',
    label: 'Governance pages',
    items: GOVERNANCE_SUBNAV_ITEMS,
  },
  {
    path: '/studio/updates',
    label: 'Posts pages',
    items: UPDATES_SUBNAV_ITEMS,
  },
] as const;

const tabParam = (url: string | undefined) => {
  const tab = new URLSearchParams(url?.split('?')[1] ?? '').get('tab');
  return tab === 'feature-requests' ? 'topics' : tab;
};

export const isTabSubnavActive = (current: string | undefined, to: string) =>
  current?.split('?')[0] === to.split('?')[0] &&
  tabParam(current) === tabParam(to);

const findTabSubnavGroup = (current: string | undefined) => {
  const pathname = current?.split('?')[0];
  return TAB_SUBNAV_GROUPS.find((item) => item.path === pathname);
};

function TabSubNav({ current }: { current?: string }) {
  const { t } = useTranslation('web');
  const group = findTabSubnavGroup(current);
  if (!group) {
    return null;
  }
  return (
    <SectionTabs
      aria-label={group.label}
      items={group.items.map((item) => ({
        id: item.to,
        to: item.to,
        label: t(item.labelKey),
        icon: item.icon,
        active: isTabSubnavActive(current, item.to),
      }))}
    />
  );
}

export const STUDIO_NAV_TOUR_STEPS: TourStep[] = PRIMARY.map(
  (item): TourStep => ({
    id: `nav-item-${item.to}`,
    label: item.label,
    description: item.description,
  }),
);

const SECTION_PREFIXES: Record<string, readonly string[]> = {
  '/studio': [
    '/studio',
    '/studio/stats',
    '/studio/insights',
    '/studio/governance',
    '/studio/updates',
    '/studio/audience',
    '/studio/revenue',
    '/studio/stripe',
    '/studio/releases',
    '/studio/distribution',
    '/studio/editor',
    '/studio/mastering',
    '/studio/setup-channel',
    '/studio/go-live',
    '/studio/info',
    '/studio/schedule',
    '/studio/events',
    '/studio/shows',
    '/studio/channel',
  ],
};

const isActive = (current: string | undefined, to: string) => {
  if (!current) {
    return false;
  }
  const pathname = current.split('?')[0];
  if (to === '/studio') {
    return (
      pathname === '/studio' ||
      matchesSectionRoute(
        pathname,
        SECTION_PREFIXES[to].filter((prefix) => prefix !== '/studio'),
      )
    );
  }
  return matchesSectionRoute(pathname, SECTION_PREFIXES[to] ?? [to]);
};

export const getStudioPrimaryRoute = (current: string | undefined) =>
  PRIMARY.find((item) => isActive(current, item.to))?.to ?? null;

export function getStudioSubmenuItems(
  section: keyof typeof SUBMENUS,
): StudioSubmenuItem[] {
  // Stripe is nested under Audience via AudienceSubNav (same pattern as
  // BroadcastSubNav) — do not insert it as a Studio sibling tab.
  return [...SUBMENUS[section]];
}

const isSubmenuActive = (current: string | undefined, to: string) => {
  const pathname = current?.split('?')[0];
  // Every former Perform/go-live page (now nested under this single
  // Broadcast tab via BroadcastSubNav) lights Studio's Broadcast tab.
  if (to === '/studio/go-live') {
    return (
      pathname === '/studio/go-live' ||
      pathname === '/studio/info' ||
      pathname === '/studio/schedule' ||
      pathname === '/studio/events' ||
      pathname?.startsWith('/studio/events/') === true ||
      pathname === '/studio/shows' ||
      pathname?.startsWith('/studio/shows/') === true ||
      pathname === '/studio/channel'
    );
  }
  // Audience parent tab stays lit for Overview, Tiers, and Stripe.
  if (to === '/studio/audience') {
    return (
      pathname === '/studio/audience' ||
      pathname === '/studio/revenue' ||
      pathname === '/studio/stripe'
    );
  }
  if (to === '/studio/stats') {
    return (
      pathname === '/studio/stats' ||
      pathname?.startsWith('/studio/stats/') === true ||
      pathname === '/studio/insights' ||
      pathname?.startsWith('/studio/insights/') === true
    );
  }
  if (to === '/studio/editor') {
    return (
      pathname === '/studio/editor' ||
      pathname?.startsWith('/studio/editor/') === true ||
      pathname === '/studio/mastering' ||
      pathname?.startsWith('/studio/mastering/') === true
    );
  }
  return (
    (to.includes('?')
      ? current === to
      : to === '/library' || to === '/studio'
        ? pathname === to
        : pathname === to || pathname?.startsWith(`${to}/`) === true) ||
    (to === '/library/sounds' &&
      (pathname?.startsWith('/studio/sounds') === true ||
        pathname?.startsWith('/studio/archive') === true)) ||
    (to === '/library/collections' &&
      (pathname === '/studio/collections' ||
        pathname?.startsWith('/studio/collections/') === true ||
        pathname === '/studio/playlists' ||
        pathname?.startsWith('/studio/playlists/') === true ||
        pathname === '/studio/stash' ||
        pathname?.startsWith('/studio/stash/') === true ||
        pathname === '/studio/recordings' ||
        pathname?.startsWith('/studio/recordings/') === true ||
        pathname === '/library/recordings' ||
        pathname === '/library/media' ||
        pathname === '/library/smartlinks'))
  );
};

export function litStudioSubmenuDestinations(
  current: string | undefined,
): string[] {
  const section = getStudioPrimaryRoute(current);
  if (!section || !(section in SUBMENUS)) {
    return [];
  }
  return getStudioSubmenuItems(section as keyof typeof SUBMENUS)
    .filter((item) => isSubmenuActive(current, item.to))
    .map((item) => item.to);
}

export const isBroadcastSubnavActive = (
  current: string | undefined,
  to: string,
) => {
  const pathname = current?.split('?')[0];
  if (to === '/studio/channel?tab=radio') {
    return (
      current === '/studio/channel?tab=radio' ||
      current === '/studio/channel?tab=multicast'
    );
  }
  if (to === '/studio/channel') {
    return (
      pathname === '/studio/channel' &&
      current !== '/studio/channel?tab=radio' &&
      current !== '/studio/channel?tab=multicast'
    );
  }
  if (to === '/studio/go-live') {
    return pathname === '/studio/go-live' || pathname === '/studio/info';
  }
  return pathname === to || pathname?.startsWith(`${to}/`) === true;
};

export function isStudioBroadcastGroup(current: string | undefined): boolean {
  const pathname = current?.split('?')[0] ?? '';
  return (
    pathname === '/studio/go-live' ||
    pathname === '/studio/info' ||
    pathname === '/studio/schedule' ||
    pathname === '/studio/events' ||
    pathname.startsWith('/studio/events/') ||
    pathname === '/studio/shows' ||
    pathname.startsWith('/studio/shows/') ||
    pathname === '/studio/channel'
  );
}

export function isStudioAudienceGroup(current: string | undefined): boolean {
  const pathname = current?.split('?')[0] ?? '';
  return (
    pathname === '/studio/audience' ||
    pathname === '/studio/revenue' ||
    pathname === '/studio/stripe'
  );
}

/** Second-level tab strip nested inside every Broadcast-group page
 * (go-live, schedule, events, shows, channel) — Studio's own submenu only
 * shows one "Broadcast" tab for all of these (see `isSubmenuActive`
 * above), so this is where Schedule/Events/Shows/Channel/Radio become
 * reachable. Prefer mounting via `StudioNav` (global chrome) rather than
 * duplicating this inside each page. */
export function BroadcastSubNav({ current }: { current?: string }) {
  const { t } = useTranslation('web');
  return (
    <SectionTabs
      aria-label="Broadcast pages"
      items={BROADCAST_SUBNAV_ITEMS.map((item) => ({
        id: item.to,
        to: item.to,
        label: t(item.labelKey),
        icon: item.icon,
        active: isBroadcastSubnavActive(current, item.to),
      }))}
    />
  );
}

const GO_LIVE_SESSION_ICONS: Record<GoLiveTabId, ReactNode> = {
  prep: <RadioTowerIcon size={16} />,
  credentials: <KeyRoundIcon size={16} />,
  recording: <Disc3Icon size={16} />,
  destinations: <CastIcon size={16} />,
  'green-room': <MicIcon size={16} />,
};

/**
 * On `/studio/go-live`, replace BroadcastSubNav with Prep session tabs plus
 * Schedule/Events/Shows/Channel/Radio as siblings — one nested strip instead
 * of Broadcast pages + in-page Prep tabs (artist-lifecycle P2).
 */
export function GoLiveSessionSubNav({ current }: { current?: string }) {
  const { t } = useTranslation('web');
  const sessionItems = GO_LIVE_TABS.map((tab) => ({
    id: goLiveTabPath(tab),
    to: goLiveTabPath(tab),
    label: GO_LIVE_TAB_LABELS[tab],
    icon: GO_LIVE_SESSION_ICONS[tab],
    active: isGoLiveSessionTabActive(current, tab),
  }));
  const siblingItems = BROADCAST_SUBNAV_ITEMS.filter(
    (item) => item.to !== '/studio/go-live',
  ).map((item) => ({
    id: item.to,
    to: item.to,
    label: t(item.labelKey),
    icon: item.icon,
    active: isBroadcastSubnavActive(current, item.to),
  }));
  return (
    <SectionTabs
      aria-label="Go live session"
      items={[...sessionItems, ...siblingItems]}
    />
  );
}

export const isAudienceSubnavActive = (
  current: string | undefined,
  to: string,
) => {
  const pathname = current?.split('?')[0];
  if (to === '/studio/audience?tab=tiers') {
    return (
      current === '/studio/audience?tab=tiers' ||
      (pathname === '/studio/audience' &&
        current?.includes('tab=tiers') === true)
    );
  }
  if (to === '/studio/audience') {
    return (
      (pathname === '/studio/audience' || pathname === '/studio/revenue') &&
      current?.includes('tab=tiers') !== true
    );
  }
  if (to === '/studio/stripe') {
    return pathname === '/studio/stripe';
  }
  return pathname === to;
};

/** Second-level tab strip for Audience-group pages (overview, tiers, Stripe).
 * Studio's submenu only shows one "Audience" tab for all of these. Prefer
 * mounting via `StudioNav` (global chrome). */
export function AudienceSubNav({ current }: { current?: string }) {
  const { t } = useTranslation('web');
  const stripeConfigured = useStripeConfigured();
  const items = AUDIENCE_SUBNAV_ITEMS.filter(
    (item) => !('stripeOnly' in item && item.stripeOnly) || stripeConfigured,
  );

  return (
    <SectionTabs
      aria-label="Audience pages"
      items={items.map((item) => ({
        id: item.to,
        to: item.to,
        label: t(item.labelKey),
        icon: item.icon,
        active: isAudienceSubnavActive(current, item.to),
      }))}
    />
  );
}

export const hasStudioNestedNav = (current: string | undefined) =>
  isGoLiveSessionRoute(current) ||
  isStudioBroadcastGroup(current) ||
  isStudioAudienceGroup(current) ||
  findTabSubnavGroup(current) !== undefined;

export const StudioNav = ({ current }: { current?: string }) => (
  <StudioNavigation current={current} />
);

export function StudioMainNavItems() {
  const { t } = useTranslation('web');
  const current = useRouterState({
    select: (state) => state.location.pathname + state.location.searchStr,
  });

  return (
    <div className="flex flex-col gap-2">
      {PRIMARY.filter((item) => item.to !== '/studio').map((item) => (
        <SidebarNavigationItem
          key={item.to}
          to={item.to}
          icon={item.icon}
          label={t(item.labelKey)}
          isSelected={isActive(current, item.to)}
        />
      ))}
    </div>
  );
}

const STUDIO_SECTION_MENU_SLOT = 'border-border min-h-7 min-w-0 border-b pb-2';
const STUDIO_NESTED_NAV_SLOT =
  'border-border flex min-h-10 w-full min-w-0 flex-nowrap items-end gap-y-1 overflow-x-auto border-b pb-2';

function StudioNavigation({ current }: { current?: string }) {
  const { t } = useTranslation('web');
  const selectedSection = getStudioPrimaryRoute(current) ?? '/studio';
  const sectionLabel =
    PRIMARY.find((item) => item.to === selectedSection)?.labelKey ??
    'nav.studio';

  const submenu = getStudioSubmenuItems(
    selectedSection as keyof typeof SUBMENUS,
  );

  if (submenu.length === 0) {
    return null;
  }

  const showBroadcast = isStudioBroadcastGroup(current);
  const showGoLiveSession = isGoLiveSessionRoute(current);
  const showAudience = isStudioAudienceGroup(current);

  return (
    <div
      className="flex min-w-0 flex-col"
      data-studio-navigation
      data-testid="studio-navigation"
    >
      <div className={STUDIO_SECTION_MENU_SLOT} data-studio-section-menu>
        <SectionTabs
          aria-label={`${t(sectionLabel)} pages`}
          items={submenu.map((item) => ({
            id: item.to,
            to: item.to,
            label: t(item.labelKey),
            icon: item.icon,
            active: isSubmenuActive(current, item.to),
          }))}
        />
      </div>
      {hasStudioNestedNav(current) ? (
        <div
          className={STUDIO_NESTED_NAV_SLOT}
          data-studio-nested-nav
          data-testid="studio-nested-nav"
        >
          {showGoLiveSession ? (
            <GoLiveSessionSubNav current={current} />
          ) : showBroadcast ? (
            <BroadcastSubNav current={current} />
          ) : null}
          {showAudience ? <AudienceSubNav current={current} /> : null}
          <TabSubNav current={current} />
        </div>
      ) : null}
    </div>
  );
}
