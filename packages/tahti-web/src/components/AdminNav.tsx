import { useNavigate } from '@tanstack/react-router';
import {
  ActivityIcon,
  BanknoteIcon,
  FileTextIcon,
  FlagIcon,
  GaugeIcon,
  ImageIcon,
  LanguagesIcon,
  LibraryIcon,
  MapIcon,
  MapPinIcon,
  MegaphoneIcon,
  PuzzleIcon,
  RadioIcon,
  ServerIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UsersIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { TabLabel, Tabs } from '@tahti-player/ui';

import type { TourStep } from '../lib/pageTour';
import { matchesSectionRoute } from '../lib/sectionNavigation';
import { SectionTabs } from './SectionTabs';

export const PRIMARY = [
  {
    to: '/admin',
    label: 'Dashboard',
    icon: <GaugeIcon size={16} aria-hidden />,
    description: 'Platform-wide overview — activity, health, and shortcuts.',
  },
  {
    to: '/admin/logs',
    label: 'Logs',
    icon: <FileTextIcon size={16} aria-hidden />,
    description:
      'Live container logs from every service in the production stack.',
  },
  {
    to: '/admin/moderation',
    label: 'Moderation',
    icon: <ShieldCheckIcon size={16} aria-hidden />,
    description:
      'Support, beta applications, radio submissions, Selects, content reports, and feature requests — one tabbed queue.',
  },
  {
    to: '/admin/users',
    label: 'Users',
    icon: <UsersIcon size={16} aria-hidden />,
    description: 'Search accounts and edit role, membership, and suspension.',
  },
  {
    to: '/admin/content',
    label: 'Content',
    icon: <LibraryIcon size={16} aria-hidden />,
    description:
      'System content overview — catalog totals, latest uploads, and recordings.',
  },
  {
    to: '/admin/radio',
    label: 'Radio',
    icon: <RadioIcon size={16} aria-hidden />,
    description:
      'Tahti Radio and Tahti Selects rotation, live from the station.',
  },
  {
    to: '/admin/news',
    label: 'News',
    icon: <FileTextIcon size={16} aria-hidden />,
    description: 'Publish platform-wide news posts.',
  },
  {
    to: '/admin/streams',
    label: 'Streams',
    icon: <ServerIcon size={16} aria-hidden />,
    description: 'Monitor live ingest and stream health across channels.',
  },
  {
    to: '/admin/venues',
    label: 'Venues',
    icon: <MapPinIcon size={16} aria-hidden />,
    description: 'Verify and manage registered venue listings.',
  },
  {
    to: '/admin/top-lists',
    label: 'Top lists',
    icon: <TrophyIcon size={16} aria-hidden />,
    description: 'Editorial top-track and top-artist lists.',
  },
  {
    to: '/admin/announcements',
    label: 'Announcements',
    icon: <MegaphoneIcon size={16} aria-hidden />,
    description: 'Site-wide banners and announcement messages.',
  },
  {
    to: '/admin/storage',
    label: 'Storage',
    icon: <ServerIcon size={16} aria-hidden />,
    description:
      'Disk/object storage space, quotas, and every uploaded file across the platform.',
  },
  {
    to: '/admin/artwork-presets',
    label: 'Artwork presets',
    icon: <ImageIcon size={16} aria-hidden />,
    description:
      'Choose and replace the abstract artwork defaults for uploads.',
  },
  {
    to: '/admin/financial',
    label: 'Financial',
    icon: <BanknoteIcon size={16} aria-hidden />,
    description: 'Membership revenue, payouts, and financial records.',
  },
  {
    to: '/admin/governance',
    label: 'Governance',
    icon: <FlagIcon size={16} aria-hidden />,
    description:
      'Member votes, annual reports, grants, and AGM — one tabbed hub.',
  },
  {
    to: '/admin/disco-widgets',
    label: 'Disco widgets',
    icon: <SettingsIcon size={16} aria-hidden />,
    description:
      'Register and manage available listener, artist, and admin add-ons.',
  },
  {
    to: '/admin/status',
    label: 'Status',
    icon: <ActivityIcon size={16} aria-hidden />,
    description: 'Platform status page content and incident history.',
  },
  {
    to: '/admin/vendors',
    label: 'Vendors',
    icon: <SettingsIcon size={16} aria-hidden />,
    description: 'Track vendors, integrations, launch checks, and DPAs.',
  },
  {
    to: '/admin/i18n',
    label: 'Languages',
    icon: <LanguagesIcon size={16} aria-hidden />,
    description: 'Add languages and import translation CSVs.',
  },
  {
    to: '/admin/tahti-selects',
    label: 'Tahti Selects',
    icon: <RadioIcon size={16} aria-hidden />,
    description: 'Manage the Tahti Selects editorial stream and rotation.',
  },
  {
    to: '/admin/orphan-pages',
    label: 'Orphan pages',
    icon: <PuzzleIcon size={16} aria-hidden />,
    description:
      'Real pages that shipped without a menu entry or an in-app link, gathered here as tabs.',
  },
  {
    to: '/admin/map',
    label: 'Map',
    icon: <MapIcon size={16} aria-hidden />,
    description: 'Screen atlas of listener, studio, and admin surfaces.',
  },
] as const;

export const ADMIN_SECTIONS = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      '/admin',
      '/admin/financial',
      '/admin/storage',
      '/admin/artwork-presets',
      '/admin/logs',
      '/admin/status',
      '/admin/vendors',
    ].map((to) => PRIMARY.find((item) => item.to === to)!),
  },
  {
    id: 'community',
    label: 'Community',
    items: PRIMARY.filter((item) =>
      ['/admin/moderation', '/admin/users', '/admin/governance'].includes(
        item.to,
      ),
    ),
  },
  {
    id: 'content',
    label: 'Content',
    items: PRIMARY.filter((item) =>
      [
        '/admin/radio',
        '/admin/tahti-selects',
        '/admin/content',
        '/admin/news',
        '/admin/top-lists',
        '/admin/announcements',
      ].includes(item.to),
    ).sort((left, right) => {
      if (left.to === '/admin/content') {
        return -1;
      }
      if (right.to === '/admin/content') {
        return 1;
      }
      return 0;
    }),
  },
  {
    id: 'operations',
    label: 'Manage',
    items: PRIMARY.filter((item) =>
      [
        '/admin/streams',
        '/admin/venues',
        '/admin/disco-widgets',
        '/admin/i18n',
        '/admin/orphan-pages',
        '/admin/map',
      ].includes(item.to),
    ),
  },
] as const;

const SUBMENU_SLOT_CLASS = 'min-h-7';

export const ADMIN_NAV_TOUR_STEPS: TourStep[] = PRIMARY.map(
  (item): TourStep => ({
    id: `nav-item-${item.to}`,
    label: item.label,
    description: item.description,
  }),
);

function isActive(current: string | undefined, to: string) {
  return to === '/admin' ? current === to : matchesSectionRoute(current, [to]);
}

function useAdminNavParts(
  current: string | undefined,
  moderationPendingCount: number | undefined,
) {
  const navigate = useNavigate();
  const routeSection = ADMIN_SECTIONS.find((section) =>
    section.items.some((item) => isActive(current, item.to)),
  );
  const section = routeSection;

  const selectedSectionIndex = ADMIN_SECTIONS.findIndex(
    (item) => item.id === section?.id,
  );
  const tabs = (
    <div
      className="border-border w-fit max-w-full overflow-x-auto rounded-lg border p-1"
      data-admin-section-tabs
    >
      <Tabs.Root
        className="w-fit max-w-full gap-0"
        selectedIndex={Math.max(0, selectedSectionIndex)}
        onChange={(index) => {
          const firstPage = ADMIN_SECTIONS[index]?.items[0];
          if (firstPage) {
            void navigate({ to: firstPage.to });
          }
        }}
        tabClassName={
          selectedSectionIndex < 0
            ? 'data-[selected]:bg-transparent data-[selected]:text-foreground-secondary'
            : undefined
        }
      >
        <Tabs.List aria-label="Admin sections" className="w-fit">
          {ADMIN_SECTIONS.map((item) => (
            <Tabs.Tab key={item.id}>
              <TabLabel icon={item.items[0]?.icon}>{item.label}</TabLabel>
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.Root>
    </div>
  );
  const menu = (
    <div className={SUBMENU_SLOT_CLASS} data-admin-section-menu>
      {section ? (
        <SectionTabs
          aria-label={`Admin ${section.label}`}
          items={section.items.map((link) => ({
            id: link.to,
            label: link.label,
            icon: link.icon,
            count:
              link.to === '/admin/moderation'
                ? moderationPendingCount
                : undefined,
            to: link.to,
            active: isActive(current, link.to),
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
    <div className="flex flex-col gap-3">
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
    <div className="flex flex-col gap-3">
      {tabs}
      {menu}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
