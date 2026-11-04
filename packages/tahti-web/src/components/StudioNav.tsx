import { useNavigate, useRouterState } from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CalendarIcon,
  HeartIcon,
  LayoutGridIcon,
  ListMusicIcon,
  MicIcon,
  PartyPopperIcon,
  RadioIcon,
  RadioTowerIcon,
  Settings2Icon,
  Share2Icon,
  SlidersHorizontalIcon,
  TrendingUpIcon,
  UserRoundIcon,
  UsersIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  ButtonLink,
  FilterChips,
  SidebarNavigationItem,
} from '@tahti-player/ui';

import { matchesSectionRoute } from '../lib/sectionNavigation';
import { SectionTabs } from './SectionTabs';

type StudioSubmenuLabelKey =
  | (typeof SUBMENUS)[keyof typeof SUBMENUS][number]['labelKey']
  | 'studio.stripe';

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
      labelKey: 'studio.home',
      icon: <LayoutGridIcon size={16} />,
    },
    {
      to: '/studio/releases',
      labelKey: 'studio.music',
      icon: <ListMusicIcon size={16} />,
    },
    {
      to: '/studio/broadcast',
      labelKey: 'studio.goLive',
      icon: <RadioTowerIcon size={16} />,
    },
    {
      to: '/studio/fans',
      labelKey: 'studio.fans',
      icon: <HeartIcon size={16} />,
    },
    {
      to: '/studio/stats',
      labelKey: 'studio.stats',
      icon: <TrendingUpIcon size={16} />,
    },
    {
      to: '/studio/profile',
      labelKey: 'studio.profile',
      icon: <UserRoundIcon size={16} />,
    },
  ],
} as const;

/** The Broadcast hub's pages, all lit by the single "Broadcast" tab
 * (`studio.goLive` above); they link back with `BroadcastBackLink`. */
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
    to: '/studio/listening-parties',
    labelKey: 'studio.listeningParties' as const,
    icon: <PartyPopperIcon size={16} />,
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

/** Releases, Distribution and Editor are one job (publish music). One Studio
 * "Music" tab stays lit; the three pages live in `CatalogSubNav`. */
export const CATALOG_SUBNAV_ITEMS = [
  {
    to: '/studio/releases',
    labelKey: 'studio.releases' as const,
    icon: <ListMusicIcon size={16} />,
  },
  {
    to: '/studio/distribution',
    labelKey: 'studio.distribution' as const,
    icon: <Share2Icon size={16} />,
  },
  {
    to: '/studio/editor',
    labelKey: 'studio.editor' as const,
    icon: <SlidersHorizontalIcon size={16} />,
  },
  {
    to: '/studio/groups',
    labelKey: 'studio.groups' as const,
    icon: <UsersIcon size={16} />,
  },
] as const;

const pathMatches = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

const SECTION_PREFIXES: Record<string, readonly string[]> = {
  '/studio': [
    '/studio',
    '/studio/stats',
    '/studio/insights',
    '/studio/governance',
    '/studio/fans',
    '/studio/updates',
    '/studio/audience',
    '/studio/revenue',
    '/studio/stripe',
    '/studio/profile',
    '/studio/releases',
    '/studio/distribution',
    '/studio/editor',
    '/studio/groups',
    '/studio/mastering',
    '/studio/setup-channel',
    '/studio/broadcast',
    '/studio/go-live',
    '/studio/info',
    '/studio/schedule',
    '/studio/events',
    '/studio/listening-parties',
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
  return [...SUBMENUS[section]];
}

const isSubmenuActive = (current: string | undefined, to: string) => {
  const pathname = current?.split('?')[0];
  if (to === '/studio/broadcast') {
    return (
      pathname === '/studio/broadcast' ||
      pathname === '/studio/go-live' ||
      pathname === '/studio/info' ||
      pathname === '/studio/schedule' ||
      pathname === '/studio/events' ||
      pathname?.startsWith('/studio/events/') === true ||
      pathname === '/studio/listening-parties' ||
      pathname?.startsWith('/studio/listening-parties/') === true ||
      pathname === '/studio/shows' ||
      pathname?.startsWith('/studio/shows/') === true ||
      pathname === '/studio/channel'
    );
  }
  if (to === '/studio/fans') {
    return isStudioFansGroup(current);
  }
  if (to === '/studio/stats') {
    return (
      pathname === '/studio/stats' ||
      pathname?.startsWith('/studio/stats/') === true ||
      pathname === '/studio/insights' ||
      pathname?.startsWith('/studio/insights/') === true
    );
  }
  if (to === '/studio/releases') {
    return (
      pathname === '/studio/releases' ||
      pathname?.startsWith('/studio/releases/') === true ||
      pathname === '/studio/distribution' ||
      pathname?.startsWith('/studio/distribution/') === true ||
      pathname === '/studio/editor' ||
      pathname?.startsWith('/studio/editor/') === true ||
      pathname === '/studio/groups' ||
      pathname?.startsWith('/studio/groups/') === true ||
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

const RADIO_CHANNEL_TABS = new Set([
  'radio',
  'multicast',
  'rotation',
  'announcements',
  'pinned',
  'tahti-radio',
]);

function channelSearchTab(current: string | undefined): string | null {
  const query = current?.split('?')[1];
  if (!query) {
    return null;
  }
  return new URLSearchParams(query).get('tab');
}

export const isBroadcastSubnavActive = (
  current: string | undefined,
  to: string,
) => {
  const pathname = current?.split('?')[0];
  const tab = channelSearchTab(current);
  if (to === '/studio/channel?tab=radio') {
    return (
      pathname === '/studio/channel' &&
      tab !== null &&
      RADIO_CHANNEL_TABS.has(tab)
    );
  }
  if (to === '/studio/channel') {
    return (
      pathname === '/studio/channel' &&
      (tab === null || !RADIO_CHANNEL_TABS.has(tab))
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
    pathname === '/studio/broadcast' ||
    pathname === '/studio/go-live' ||
    pathname === '/studio/info' ||
    pathname === '/studio/schedule' ||
    pathname === '/studio/events' ||
    pathname.startsWith('/studio/events/') ||
    pathname === '/studio/listening-parties' ||
    pathname.startsWith('/studio/listening-parties/') ||
    pathname === '/studio/shows' ||
    pathname.startsWith('/studio/shows/') ||
    pathname === '/studio/channel'
  );
}

export function isStudioCatalogGroup(current: string | undefined): boolean {
  const pathname = current?.split('?')[0] ?? '';
  return (
    pathname === '/studio/releases' ||
    pathname.startsWith('/studio/releases/') ||
    pathname === '/studio/distribution' ||
    pathname.startsWith('/studio/distribution/') ||
    pathname === '/studio/editor' ||
    pathname.startsWith('/studio/editor/') ||
    pathname === '/studio/groups' ||
    pathname.startsWith('/studio/groups/') ||
    pathname === '/studio/mastering' ||
    pathname.startsWith('/studio/mastering/')
  );
}

export const isCatalogSubnavActive = (
  current: string | undefined,
  to: string,
) => {
  const pathname = current?.split('?')[0] ?? '';
  if (to === '/studio/releases') {
    return pathMatches(pathname, '/studio/releases');
  }
  if (to === '/studio/distribution') {
    return pathMatches(pathname, '/studio/distribution');
  }
  if (to === '/studio/editor') {
    return (
      pathMatches(pathname, '/studio/editor') ||
      pathMatches(pathname, '/studio/mastering')
    );
  }
  if (to === '/studio/groups') {
    return pathMatches(pathname, '/studio/groups');
  }
  return pathname === to;
};

export function CatalogSubNav({ current }: { current?: string }) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const selected =
    CATALOG_SUBNAV_ITEMS.find((item) => isCatalogSubnavActive(current, item.to))
      ?.to ?? CATALOG_SUBNAV_ITEMS[0].to;
  return (
    <FilterChips
      aria-label="Music pages"
      items={CATALOG_SUBNAV_ITEMS.map((item) => ({
        id: item.to,
        label: t(item.labelKey),
      }))}
      selected={selected}
      onChange={(id) => {
        void navigate({ to: id });
      }}
    />
  );
}

export function isStudioFansGroup(current: string | undefined): boolean {
  const pathname = current?.split('?')[0] ?? '';
  return (
    pathname === '/studio/fans' ||
    pathname === '/studio/updates' ||
    pathname === '/studio/audience' ||
    pathname === '/studio/revenue' ||
    pathname === '/studio/stripe'
  );
}

function HubBackLink({
  to,
  label,
  testId,
}: {
  to: string;
  label: string;
  testId: string;
}) {
  return (
    <ButtonLink
      to={to}
      size="sm"
      variant="text"
      className="gap-1.5"
      data-testid={testId}
      aria-label={`Back to ${label}`}
    >
      <ArrowLeftIcon size={16} aria-hidden />
      {label}
    </ButtonLink>
  );
}

/** Fans is a hub: its pages open from cards on `/studio/fans` and show a
 * back link to it instead of a second row of tabs. */
export function FansBackLink() {
  const { t } = useTranslation('web');
  return (
    <HubBackLink
      to="/studio/fans"
      label={t('studio.fans')}
      testId="studio-fans-back"
    />
  );
}

/** Broadcast is a hub too: Go live, Schedule, Shows, Events, Parties and
 * Channel open from `/studio/broadcast` and link back to it. */
export function BroadcastBackLink() {
  const { t } = useTranslation('web');
  return (
    <HubBackLink
      to="/studio/broadcast"
      label={t('studio.goLive')}
      testId="studio-broadcast-back"
    />
  );
}

const onHubItself = (current: string | undefined, hub: string) =>
  current?.split('?')[0] === hub;

export const hasStudioNestedNav = (current: string | undefined) =>
  (isStudioBroadcastGroup(current) &&
    !onHubItself(current, '/studio/broadcast')) ||
  isStudioCatalogGroup(current) ||
  (isStudioFansGroup(current) && current?.split('?')[0] !== '/studio/fans');

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

export function isStudioDetailRoute(current: string | undefined): boolean {
  const pathname = current?.split('?')[0] ?? '';
  return (
    /^\/studio\/releases\/[^/]+$/.test(pathname) ||
    /^\/studio\/shows\/(?!episodes\/)[^/]+$/.test(pathname) ||
    /^\/studio\/shows\/episodes\/[^/]+$/.test(pathname)
  );
}

function StudioNavigation({ current }: { current?: string }) {
  const { t } = useTranslation('web');
  const selectedSection = getStudioPrimaryRoute(current) ?? '/studio';
  const sectionLabel =
    PRIMARY.find((item) => item.to === selectedSection)?.labelKey ??
    'nav.studio';

  const submenu = getStudioSubmenuItems(
    selectedSection as keyof typeof SUBMENUS,
  );

  if (submenu.length === 0 || isStudioDetailRoute(current)) {
    return null;
  }

  const showBroadcast =
    isStudioBroadcastGroup(current) &&
    !onHubItself(current, '/studio/broadcast');
  const showCatalog = isStudioCatalogGroup(current);
  const showFansBack =
    isStudioFansGroup(current) && current?.split('?')[0] !== '/studio/fans';

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
          {showBroadcast ? <BroadcastBackLink /> : null}
          {showCatalog ? <CatalogSubNav current={current} /> : null}
          {showFansBack ? <FansBackLink /> : null}
        </div>
      ) : null}
    </div>
  );
}
