import { useNavigate } from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  BanknoteIcon,
  BlocksIcon,
  Building2Icon,
  Disc3Icon,
  FileTextIcon,
  GaugeIcon,
  HandshakeIcon,
  HardDriveIcon,
  ImageIcon,
  LandmarkIcon,
  LanguagesIcon,
  LayoutGridIcon,
  LibraryIcon,
  MapIcon,
  MapPinIcon,
  MegaphoneIcon,
  MessageSquareIcon,
  NewspaperIcon,
  PuzzleIcon,
  RadioIcon,
  RadioTowerIcon,
  ServerIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
  TrophyIcon,
  UsersIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation, type ParseKeys } from '@tahti-player/i18n';
import { Badge, ButtonLink, TabLabel, Tabs } from '@tahti-player/ui';

import { matchesSectionRoute } from '../lib/sectionNavigation';
import { SectionTabs } from './SectionTabs';

/**
 * Admin chrome (`PRIMARY` below) is not exhaustive. These paths are still
 * routable but only via redirects, deep links, or a parent tab’s search —
 * see `NAVIGATION-SITEMAP.md` / navigation-flow-audit. Keep this list in
 * sync when adding a redirect-only admin URL.
 */
export const ADMIN_TAB_ONLY_ROUTES = [
  '/admin/activity', // → /admin/logs
  '/admin/disco-widgets', // → /admin/addons
  '/admin/grants/$year', // governance grants child
  '/admin/moderation/$tab', // moderation search tabs
  '/admin/orphan-pages/$tab', // orphan-pages search tabs
  '/admin/support', // → /admin/moderation?tab=support
  '/admin/reports', // moderation / content-reports
  '/admin/feature-requests', // moderation feature-requests tab
  '/admin/content-reports', // moderation content-reports tab
  '/admin/radio-submissions',
  '/admin/radio-station-suggestions',
  '/admin/agm',
  '/admin/beta',
  '/admin/files',
  '/admin/governance/$tab',
  '/admin/grants',
  '/admin/hubs/$hub',
  '/admin/missed-shows',
  '/admin/storage/$userId',
  '/admin/status', // → /admin#status-checks
  '/admin/monitoring', // → /admin?tab=monitoring
] as const;

const ADMIN_PAGE_KEYS = {
  '/admin': 'adminPages.dashboard',
  '/admin/logs': 'adminPages.logs',
  '/admin/monitoring': 'adminPages.monitoring',
  '/admin/moderation': 'adminPages.moderation',
  '/admin/users': 'adminPages.users',
  '/admin/community': 'adminPages.community',
  '/admin/content': 'adminPages.content',
  '/admin/radio': 'adminPages.radio',
  '/admin/news': 'adminPages.news',
  '/admin/streams': 'adminPages.streams',
  '/admin/venues': 'adminPages.venues',
  '/admin/top-lists': 'adminPages.topLists',
  '/admin/announcements': 'adminPages.announcements',
  '/admin/storage': 'adminPages.storage',
  '/admin/artwork-presets': 'adminPages.artworkPresets',
  '/admin/financial': 'adminPages.financial',
  '/admin/governance': 'adminPages.governance',
  '/admin/addons': 'adminPages.addons',
  '/admin/status': 'adminPages.status',
  '/admin/vendors': 'adminPages.vendors',
  '/admin/i18n': 'adminPages.i18n',
  '/admin/tahti-selects': 'adminPages.tahtiSelects',
  '/admin/orphan-pages': 'adminPages.orphanPages',
  '/admin/map': 'adminPages.map',
  '/admin/diagnostics': 'adminPages.diagnostics',
  '/admin/hubs/content': 'adminNav.sectionContent',
  '/admin/hubs/coop': 'adminNav.sectionCoop',
  '/admin/hubs/platform': 'adminNav.sectionPlatform',
} as const satisfies Record<string, ParseKeys<'web'>>;

const ADMIN_SECTION_KEYS = {
  overview: 'adminNav.sectionOverview',
  inbox: 'adminNav.sectionInbox',
  people: 'adminNav.sectionPeople',
  content: 'adminNav.sectionContent',
  coop: 'adminNav.sectionCoop',
  platform: 'adminNav.sectionPlatform',
} as const satisfies Record<string, ParseKeys<'web'>>;

export const ADMIN_HUB_DESCRIPTION_KEYS = {
  '/admin/hubs/content': 'adminNav.hubContentDescription',
  '/admin/hubs/coop': 'adminNav.hubCoopDescription',
  '/admin/hubs/platform': 'adminNav.hubPlatformDescription',
} as const satisfies Record<string, ParseKeys<'web'>>;

export const ADMIN_PAGE_DESCRIPTION_KEYS = {
  '/admin': 'adminPages.dashboardDescription',
  '/admin/logs': 'adminPages.logsDescription',
  '/admin/moderation': 'adminPages.moderationDescription',
  '/admin/users': 'adminPages.usersDescription',
  '/admin/community': 'adminPages.communityDescription',
  '/admin/content': 'adminPages.contentDescription',
  '/admin/radio': 'adminPages.radioDescription',
  '/admin/news': 'adminPages.newsDescription',
  '/admin/streams': 'adminPages.streamsDescription',
  '/admin/venues': 'adminPages.venuesDescription',
  '/admin/top-lists': 'adminPages.topListsDescription',
  '/admin/announcements': 'adminPages.announcementsDescription',
  '/admin/storage': 'adminPages.storageDescription',
  '/admin/artwork-presets': 'adminPages.artworkPresetsDescription',
  '/admin/financial': 'adminPages.financialDescription',
  '/admin/governance': 'adminPages.governanceDescription',
  '/admin/addons': 'adminPages.addonsDescription',
  '/admin/vendors': 'adminPages.vendorsDescription',
  '/admin/i18n': 'adminPages.i18nDescription',
  '/admin/tahti-selects': 'adminPages.tahtiSelectsDescription',
  '/admin/orphan-pages': 'adminPages.orphanPagesDescription',
  '/admin/map': 'adminPages.mapDescription',
  '/admin/diagnostics': 'adminPages.diagnosticsDescription',
  '/admin/hubs/content': 'adminPages.hubContentCardDescription',
  '/admin/hubs/coop': 'adminPages.hubCoopCardDescription',
  '/admin/hubs/platform': 'adminPages.hubPlatformCardDescription',
} as const satisfies Record<string, ParseKeys<'web'>>;

export function adminPageLabelKey(to: string): ParseKeys<'web'> | null {
  return ADMIN_PAGE_KEYS[to as keyof typeof ADMIN_PAGE_KEYS] ?? null;
}

export function adminPageDescriptionKey(to: string): ParseKeys<'web'> | null {
  return (
    ADMIN_PAGE_DESCRIPTION_KEYS[
      to as keyof typeof ADMIN_PAGE_DESCRIPTION_KEYS
    ] ?? null
  );
}

export function adminSectionLabelKey(id: string): ParseKeys<'web'> | null {
  return ADMIN_SECTION_KEYS[id as keyof typeof ADMIN_SECTION_KEYS] ?? null;
}

export const PRIMARY = [
  {
    to: '/admin',
    label: 'Dashboard',
    Icon: GaugeIcon,
    icon: <GaugeIcon size={16} aria-hidden />,
    description: 'Platform health and the work that needs a board eye.',
  },
  {
    to: '/admin/logs',
    label: 'Logs',
    Icon: FileTextIcon,
    icon: <FileTextIcon size={16} aria-hidden />,
    description:
      'Live container logs from every service in the production stack.',
  },
  {
    to: '/admin/moderation',
    label: 'Inbox',
    Icon: ShieldCheckIcon,
    icon: <ShieldCheckIcon size={16} aria-hidden />,
    description:
      'Support, beta applications, radio submissions, Selects, content reports, and feature requests — one tabbed queue.',
  },
  {
    to: '/admin/users',
    label: 'Users',
    Icon: UsersIcon,
    icon: <UsersIcon size={16} aria-hidden />,
    description: 'Search accounts and edit role, membership, and suspension.',
  },
  {
    to: '/admin/community',
    label: 'Community',
    Icon: MessageSquareIcon,
    icon: <MessageSquareIcon size={16} aria-hidden />,
    description: 'Chat volume and mail delivery for the last day.',
  },
  {
    to: '/admin/content',
    label: 'Catalog',
    Icon: LibraryIcon,
    icon: <LibraryIcon size={16} aria-hidden />,
    description:
      'System content overview — catalog totals, latest uploads, and recordings.',
  },
  {
    to: '/admin/radio',
    label: 'Radio',
    Icon: RadioIcon,
    icon: <RadioIcon size={16} aria-hidden />,
    description:
      'Tahti Radio and Tahti Selects rotation, live from the station.',
  },
  {
    to: '/admin/news',
    label: 'News',
    Icon: NewspaperIcon,
    icon: <NewspaperIcon size={16} aria-hidden />,
    description: 'Publish platform-wide news posts.',
  },
  {
    to: '/admin/streams',
    label: 'Streams',
    Icon: RadioTowerIcon,
    icon: <RadioTowerIcon size={16} aria-hidden />,
    description: 'Monitor live ingest and stream health across channels.',
  },
  {
    to: '/admin/venues',
    label: 'Venues',
    Icon: MapPinIcon,
    icon: <MapPinIcon size={16} aria-hidden />,
    description: 'Verify and manage registered venue listings.',
  },
  {
    to: '/admin/top-lists',
    label: 'Top lists',
    Icon: TrophyIcon,
    icon: <TrophyIcon size={16} aria-hidden />,
    description: 'Editorial top-track and top-artist lists.',
  },
  {
    to: '/admin/announcements',
    label: 'Announcements',
    Icon: MegaphoneIcon,
    icon: <MegaphoneIcon size={16} aria-hidden />,
    description: 'Site-wide banners and announcement messages.',
  },
  {
    to: '/admin/storage',
    label: 'Storage',
    Icon: HardDriveIcon,
    icon: <HardDriveIcon size={16} aria-hidden />,
    description:
      'Disk/object storage space, quotas, and every uploaded file across the platform.',
  },
  {
    to: '/admin/artwork-presets',
    label: 'Artwork presets',
    Icon: ImageIcon,
    icon: <ImageIcon size={16} aria-hidden />,
    description:
      'Choose and replace the abstract artwork defaults for uploads.',
  },
  {
    to: '/admin/financial',
    label: 'Financial',
    Icon: BanknoteIcon,
    icon: <BanknoteIcon size={16} aria-hidden />,
    description: 'Membership revenue, payouts, and financial records.',
  },
  {
    to: '/admin/governance',
    label: 'Governance',
    Icon: LandmarkIcon,
    icon: <LandmarkIcon size={16} aria-hidden />,
    description:
      'Member votes, annual reports, grants, and AGM — hub of area cards.',
  },
  {
    to: '/admin/addons',
    label: 'Add-ons',
    Icon: BlocksIcon,
    icon: <BlocksIcon size={16} aria-hidden />,
    description:
      'Register and manage available listener, artist, and admin add-ons.',
  },
  {
    to: '/admin/diagnostics',
    label: 'Diagnostics',
    Icon: StethoscopeIcon,
    icon: <StethoscopeIcon size={16} aria-hidden />,
    description: 'Logs, orphan pages, and the screen atlas.',
  },
  {
    to: '/admin/vendors',
    label: 'Vendors',
    Icon: Building2Icon,
    icon: <Building2Icon size={16} aria-hidden />,
    description: 'Track vendors, integrations, launch checks, and DPAs.',
  },
  {
    to: '/admin/i18n',
    label: 'Languages',
    Icon: LanguagesIcon,
    icon: <LanguagesIcon size={16} aria-hidden />,
    description: 'Add languages and import translation CSVs.',
  },
  {
    to: '/admin/tahti-selects',
    label: 'Tahti Selects',
    Icon: Disc3Icon,
    icon: <Disc3Icon size={16} aria-hidden />,
    description: 'Manage the Tahti Selects editorial stream and rotation.',
  },
  {
    to: '/admin/orphan-pages',
    label: 'Orphan pages',
    Icon: PuzzleIcon,
    icon: <PuzzleIcon size={16} aria-hidden />,
    description:
      'Real pages that shipped without a menu entry or an in-app link, gathered here as tabs.',
  },
  {
    to: '/admin/map',
    label: 'Map',
    Icon: MapIcon,
    icon: <MapIcon size={16} aria-hidden />,
    description: 'Screen atlas of listener, studio, and admin surfaces.',
  },
  {
    to: '/admin/hubs/content',
    label: 'Content',
    Icon: LayoutGridIcon,
    icon: <LayoutGridIcon size={16} aria-hidden />,
    description:
      'News, announcements, Selects, top lists, radio, venues, artwork presets and the catalog.',
  },
  {
    to: '/admin/hubs/coop',
    label: 'Co-op',
    Icon: HandshakeIcon,
    icon: <HandshakeIcon size={16} aria-hidden />,
    description: 'Board, AGM, grants, annual reports, records and finances.',
  },
  {
    to: '/admin/hubs/platform',
    label: 'Platform',
    Icon: ServerIcon,
    icon: <ServerIcon size={16} aria-hidden />,
    description:
      'Add-ons, languages, vendors, storage, streams, logs and diagnostics.',
  },
] as const;

const pages = (paths: readonly string[]) =>
  paths.map((to) => PRIMARY.find((item) => item.to === to)!);

type AdminSection = {
  id: string;
  label: string;
  /** A hub section's first page is a page of cards; its other pages show a
   * back link to it instead of a row of tabs. */
  hub?: string;
  items: ReturnType<typeof pages>;
};

export const ADMIN_SECTIONS: readonly AdminSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: pages(['/admin']),
  },
  {
    id: 'inbox',
    label: 'Inbox',
    items: pages(['/admin/moderation']),
  },
  {
    id: 'people',
    label: 'People',
    items: pages(['/admin/users', '/admin/community']),
  },
  {
    id: 'content',
    label: 'Content',
    hub: '/admin/hubs/content',
    items: pages([
      '/admin/hubs/content',
      '/admin/news',
      '/admin/announcements',
      '/admin/tahti-selects',
      '/admin/top-lists',
      '/admin/radio',
      '/admin/venues',
      '/admin/artwork-presets',
      '/admin/content',
    ]),
  },
  {
    id: 'coop',
    label: 'Co-op',
    hub: '/admin/hubs/coop',
    items: pages(['/admin/hubs/coop', '/admin/governance', '/admin/financial']),
  },
  {
    id: 'platform',
    label: 'Platform',
    hub: '/admin/hubs/platform',
    items: pages([
      '/admin/hubs/platform',
      '/admin/addons',
      '/admin/i18n',
      '/admin/vendors',
      '/admin/storage',
      '/admin/streams',
      '/admin/diagnostics',
      '/admin/logs',
      '/admin/orphan-pages',
      '/admin/map',
    ]),
  },
];

/** Opened from Diagnostics hub cards; stay in the Platform section but
 * do not appear as Platform hub cards themselves. */
const PLATFORM_DIAGNOSTICS_PAGES = new Set([
  '/admin/logs',
  '/admin/orphan-pages',
  '/admin/map',
]);

export function adminSectionForPath(
  current: string | undefined,
): AdminSection | undefined {
  return ADMIN_SECTIONS.find((section) =>
    section.items.some((item) => isAdminNavItemActive(current, item.to)),
  );
}

export function adminHubItems(hub: string) {
  const section = ADMIN_SECTIONS.find((item) => item.hub === hub);
  if (!section) {
    return [];
  }
  return section.items.filter((item) => {
    if (item.to === hub) {
      return false;
    }
    if (
      hub === '/admin/hubs/platform' &&
      PLATFORM_DIAGNOSTICS_PAGES.has(item.to)
    ) {
      return false;
    }
    return true;
  });
}

const SUBMENU_SLOT_CLASS = 'min-h-7';

export function isAdminNavItemActive(
  location: string | undefined,
  to: string,
): boolean {
  const current = location?.split('?')[0];
  if (to === '/admin') {
    return current === to;
  }
  const prefixes =
    to === '/admin/governance'
      ? (['/admin/governance', '/admin/grants'] as const)
      : [to];
  return matchesSectionRoute(current, prefixes);
}

function useAdminNavParts(
  current: string | undefined,
  moderationPendingCount: number | undefined,
) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const section = adminSectionForPath(current);
  const pageLabel = (item: { to: string; label: string }) => {
    const key = adminPageLabelKey(item.to);
    return key ? t(key) : item.label;
  };
  const sectionLabel = (item: { id: string; label: string }) => {
    const key = adminSectionLabelKey(item.id);
    return key ? t(key) : item.label;
  };

  const selectedSectionIndex = ADMIN_SECTIONS.findIndex(
    (item) => item.id === section?.id,
  );
  const tabs = (
    <div className="w-fit max-w-full overflow-x-auto" data-admin-section-tabs>
      <Tabs.Root
        variant="segmented"
        className="w-fit max-w-full gap-0"
        selectedIndex={Math.max(0, selectedSectionIndex)}
        onChange={(index) => {
          const target = ADMIN_SECTIONS[index];
          const firstPage = target?.hub ?? target?.items[0]?.to;
          if (firstPage) {
            void navigate({ to: firstPage });
          }
        }}
        tabClassName={
          selectedSectionIndex < 0
            ? 'data-[selected]:bg-transparent data-[selected]:text-foreground-secondary data-[selected]:shadow-none data-[selected]:ring-0'
            : undefined
        }
      >
        <Tabs.List aria-label={t('adminNav.sections')} className="w-fit">
          {ADMIN_SECTIONS.map((item) => (
            <Tabs.Tab key={item.id}>
              <TabLabel icon={item.items[0]?.icon}>
                <span className="inline-flex items-center gap-1.5">
                  {sectionLabel(item)}
                  {item.id === 'inbox' && moderationPendingCount ? (
                    <Badge
                      variant="pill"
                      color="red"
                      data-testid="admin-inbox-count"
                    >
                      {moderationPendingCount}
                    </Badge>
                  ) : null}
                </span>
              </TabLabel>
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.Root>
    </div>
  );
  const onHubChild =
    section?.hub !== undefined && !isAdminNavItemActive(current, section.hub);
  const menu = (
    <div className={SUBMENU_SLOT_CLASS} data-admin-section-menu>
      {section?.hub && onHubChild ? (
        <ButtonLink
          to={section.hub}
          size="sm"
          variant="text"
          className="gap-1.5"
          data-testid="admin-hub-back"
          aria-label={t('adminNav.backTo', { section: sectionLabel(section) })}
        >
          <ArrowLeftIcon size={16} aria-hidden />
          {sectionLabel(section)}
        </ButtonLink>
      ) : section && !section.hub && section.items.length > 1 ? (
        <SectionTabs
          aria-label={t('adminNav.sectionPages', {
            section: sectionLabel(section),
          })}
          items={section.items.map((link) => ({
            id: link.to,
            label: pageLabel(link),
            icon: link.icon,
            to: link.to,
            active: isAdminNavItemActive(current, link.to),
          }))}
        />
      ) : null}
    </div>
  );

  return { tabs, menu };
}

/** Grows page-by-page alongside the admin port — see UI-REDESIGN-WORKLOG.md. */
export function AdminNav({
  current,
  splitLayout = true,
  moderationPendingCount,
}: {
  current?: string;
  splitLayout?: boolean;
  moderationPendingCount?: number;
}) {
  const { tabs, menu } = useAdminNavParts(current, moderationPendingCount);

  return splitLayout ? (
    <>
      {tabs}
      {menu}
    </>
  ) : (
    <div className="flex flex-col gap-3" data-testid="admin-page-layout">
      {tabs}
      {menu}
    </div>
  );
}

/** Standard admin page shell: primary section tabs across the top, the
 * current section's page list directly below as a row of smaller icon
 * tabs (not a left-docked sidebar column), then page content below both. */
export function AdminPageLayout({
  current,
  moderationPendingCount,
  children,
}: {
  current?: string;
  moderationPendingCount?: number;
  children: ReactNode;
}) {
  const { tabs, menu } = useAdminNavParts(current, moderationPendingCount);

  return (
    <div className="flex flex-col gap-3" data-admin-shell>
      {tabs}
      {menu}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
