import { Link, useRouterState } from '@tanstack/react-router';
import {
  CreditCardIcon,
  HeartIcon,
  LandmarkIcon,
  LayersIcon,
  LayoutGridIcon,
  LibraryIcon,
  ListMusicIcon,
  PaletteIcon,
  RadioIcon,
  RadioTowerIcon,
  Settings2Icon,
  SlidersHorizontalIcon,
  TrendingUpIcon,
  UploadIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { SidebarNavigationItem } from '@tahti-player/ui';

import { useStripeConfigured } from '../hooks/useStripeConfigured';
import type { TourStep } from '../lib/pageTour';
import { matchesSectionRoute } from '../lib/sectionNavigation';

type StudioSubmenuLabelKey =
  | (typeof SUBMENUS)[keyof typeof SUBMENUS][number]['labelKey']
  | 'studio.stripe';

type StudioSubmenuItem = {
  to: string;
  labelKey: StudioSubmenuLabelKey;
  icon: ReactNode;
};

export const STRIPE_NAV_ITEM: StudioSubmenuItem = {
  to: '/studio/stripe',
  labelKey: 'studio.stripe',
  icon: <CreditCardIcon size={16} />,
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
  {
    to: '/studio/go-live',
    label: 'Perform',
    labelKey: 'nav.perform',
    description: 'Go live, schedule broadcasts, and manage performances.',
    descriptionKey: 'studio.performDescription',
    icon: <RadioTowerIcon size={16} aria-hidden />,
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
      to: '/studio/revenue',
      labelKey: 'studio.audience',
      icon: <HeartIcon size={16} />,
    },
    {
      to: '/library',
      labelKey: 'nav.library',
      icon: <LibraryIcon size={16} />,
    },
    {
      to: '/library/sounds',
      labelKey: 'studio.sounds',
      icon: <ListMusicIcon size={16} />,
    },
    {
      to: '/library/collections',
      labelKey: 'studio.collections',
      icon: <LayersIcon size={16} />,
    },
    {
      to: '/studio/releases',
      labelKey: 'studio.releases',
      icon: <ListMusicIcon size={16} />,
    },
    {
      to: '/library/upload',
      labelKey: 'studio.upload',
      icon: <UploadIcon size={16} />,
    },
    {
      to: '/studio/editor',
      labelKey: 'studio.editor',
      icon: <SlidersHorizontalIcon size={16} />,
    },
  ],
  '/studio/go-live': [
    {
      to: '/studio/go-live',
      labelKey: 'studio.goLive',
      icon: <RadioTowerIcon size={16} />,
    },
    {
      to: '/studio/schedule',
      labelKey: 'studio.schedule',
      icon: <RadioIcon size={16} />,
    },
    {
      to: '/studio/events',
      labelKey: 'studio.events',
      icon: <RadioIcon size={16} />,
    },
    {
      to: '/studio/shows',
      labelKey: 'studio.shows',
      icon: <RadioIcon size={16} />,
    },
    {
      to: '/studio/channel',
      labelKey: 'studio.channel',
      icon: <Settings2Icon size={16} />,
    },
    {
      to: '/studio/channel?tab=radio',
      labelKey: 'nav.radio',
      icon: <RadioIcon size={16} />,
    },
  ],
} as const;

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
    '/studio/revenue',
    '/studio/stripe',
    '/library',
    '/studio/sounds',
    '/studio/releases',
    '/studio/distribution',
    '/library/collections',
    '/studio/collections',
    '/library/recordings',
    '/studio/recordings',
    '/library/smartlinks',
    '/library/upload',
    '/studio/editor',
    '/studio/mastering',
    '/studio/stash',
    '/studio/playlists',
    '/studio/insights',
    '/studio/setup-channel',
    '/studio/archive',
    '/library/media',
  ],
  '/studio/go-live': [
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
  options: { stripeConfigured?: boolean } = {},
): StudioSubmenuItem[] {
  const items: StudioSubmenuItem[] = [...SUBMENUS[section]];
  if (section === '/studio' && options.stripeConfigured === true) {
    const audienceIndex = items.findIndex(
      (item) => item.to === '/studio/revenue',
    );
    const insertAt = audienceIndex === -1 ? items.length : audienceIndex + 1;
    items.splice(insertAt, 0, STRIPE_NAV_ITEM);
  }
  return items;
}

const isSubmenuActive = (current: string | undefined, to: string) => {
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
  if (to === '/studio/branding') {
    return (
      pathname === '/studio/branding' || pathname === '/studio/setup-channel'
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
  options: { stripeConfigured?: boolean } = {},
): string[] {
  const section = getStudioPrimaryRoute(current);
  if (!section || !(section in SUBMENUS)) {
    return [];
  }
  return getStudioSubmenuItems(section, options)
    .filter((item) => isSubmenuActive(current, item.to))
    .map((item) => item.to);
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

function StudioNavigation({ current }: { current?: string }) {
  const { t } = useTranslation('web');
  const stripeConfigured = useStripeConfigured();
  const selectedSection = getStudioPrimaryRoute(current) ?? '/studio';
  const sectionLabel =
    PRIMARY.find((item) => item.to === selectedSection)?.labelKey ??
    'nav.studio';

  const submenu = getStudioSubmenuItems(
    selectedSection as keyof typeof SUBMENUS,
    { stripeConfigured },
  );

  return (
    <div className="flex min-w-0 flex-col gap-1" data-studio-navigation>
      <nav
        aria-label={`${t(sectionLabel)} pages`}
        className="border-border flex min-w-0 flex-wrap gap-1 border-b pb-2"
        data-studio-section-menu
      >
        {submenu.length > 0 &&
          submenu.map((item) => (
            <Link
              key={item.to}
              to={item.to as never}
              activeOptions={{ exact: true }}
              aria-current={
                isSubmenuActive(current, item.to) ? 'page' : undefined
              }
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap ${
                isSubmenuActive(current, item.to)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground-secondary hover:bg-background-secondary hover:text-foreground'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              {t(item.labelKey)}
            </Link>
          ))}
      </nav>
    </div>
  );
}
