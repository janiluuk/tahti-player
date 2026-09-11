import { useRouterState } from '@tanstack/react-router';
import {
  CreditCardIcon,
  HeartIcon,
  LandmarkIcon,
  LayersIcon,
  LayoutGridIcon,
  ListMusicIcon,
  PaletteIcon,
  RadioIcon,
  RadioTowerIcon,
  Settings2Icon,
  SlidersHorizontalIcon,
  TrendingUpIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { SidebarNavigationItem } from '@tahti-player/ui';

import { useStripeConfigured } from '../hooks/useStripeConfigured';
import type { TourStep } from '../lib/pageTour';
import { matchesSectionRoute } from '../lib/sectionNavigation';
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
      to: '/studio/branding',
      labelKey: 'studio.branding',
      icon: <PaletteIcon size={16} />,
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
      icon: <TrendingUpIcon size={16} />,
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
    labelKey: 'studio.goLive' as const,
    icon: <RadioTowerIcon size={16} />,
  },
  {
    to: '/studio/schedule',
    labelKey: 'studio.schedule' as const,
    icon: <RadioIcon size={16} />,
  },
  {
    to: '/studio/events',
    labelKey: 'studio.events' as const,
    icon: <RadioIcon size={16} />,
  },
  {
    to: '/studio/shows',
    labelKey: 'studio.shows' as const,
    icon: <RadioIcon size={16} />,
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
    '/studio/branding',
    '/studio/stats',
    '/studio/governance',
    '/studio/updates',
    '/studio/audience',
    '/studio/revenue',
    '/studio/stripe',
    '/studio/sounds',
    '/studio/releases',
    '/studio/distribution',
    '/studio/collections',
    '/studio/recordings',
    '/studio/editor',
    '/studio/mastering',
    '/studio/stash',
    '/studio/playlists',
    '/studio/insights',
    '/studio/setup-channel',
    '/studio/archive',
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
  if (to === '/studio/branding') {
    return (
      pathname === '/studio/branding' || pathname === '/studio/setup-channel'
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
    (to === '/studio/releases' && pathname === '/studio/distribution') ||
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

export const StudioNav = ({
  current,
  global = false,
}: {
  current?: string;
  global?: boolean;
}) => (global ? <StudioNavigation current={current} /> : null);

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
  'border-border flex min-h-10 min-w-0 items-end border-b pb-2';

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
  const showAudience = isStudioAudienceGroup(current);

  return (
    <div className="flex min-w-0 flex-col" data-studio-navigation>
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
      <div className={STUDIO_NESTED_NAV_SLOT} data-studio-nested-nav>
        {showBroadcast ? <BroadcastSubNav current={current} /> : null}
        {showAudience ? <AudienceSubNav current={current} /> : null}
      </div>
    </div>
  );
}
