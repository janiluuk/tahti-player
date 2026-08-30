import { useNavigate } from '@tanstack/react-router';
import {
  FolderOpenIcon,
  HeartIcon,
  ImageIcon,
  InfoIcon,
  LandmarkIcon,
  LayersIcon,
  LayoutGridIcon,
  LibraryIcon,
  Link2Icon,
  ListMusicIcon,
  MicIcon,
  RadioIcon,
  RadioTowerIcon,
  Settings2Icon,
  SettingsIcon,
  SlidersHorizontalIcon,
  TrendingUpIcon,
  UploadIcon,
} from 'lucide-react';

import type { TourStep } from '../lib/pageTour';
import { matchesSectionRoute } from '../lib/sectionNavigation';
import { SectionSidebar } from './SectionSidebar';

const PRIMARY = [
  {
    to: '/studio',
    label: 'Studio',
    icon: <LayoutGridIcon size={16} aria-hidden />,
    description:
      'Your channel snapshot — status, quick links, and recent activity.',
  },
  {
    to: '/library',
    label: 'Library',
    icon: <LibraryIcon size={16} aria-hidden />,
    description: 'All your uploaded tracks, releases, and files in one place.',
  },
  {
    to: '/studio/go-live',
    label: 'Perform',
    icon: <RadioTowerIcon size={16} aria-hidden />,
    description: 'Go live, schedule broadcasts, and manage performances.',
  },
  {
    to: '/studio/channel',
    label: 'Manage',
    icon: <Settings2Icon size={16} aria-hidden />,
    description: 'Manage your channel, branding, and access.',
  },
] as const;

const SUBMENUS = {
  '/studio': [
    { to: '/studio', label: 'Overview', icon: <LayoutGridIcon size={16} /> },
    { to: '/studio/stats', label: 'Stats', icon: <TrendingUpIcon size={16} /> },
    {
      to: '/studio/governance',
      label: 'Governance',
      icon: <LandmarkIcon size={16} />,
    },
    {
      to: '/studio/updates',
      label: 'Posts',
      icon: <TrendingUpIcon size={16} />,
    },
    {
      to: '/studio/distribution',
      label: 'Distribution',
      icon: <TrendingUpIcon size={16} />,
    },
    {
      to: '/studio/revenue',
      label: 'Audience',
      icon: <HeartIcon size={16} />,
    },
  ],
  '/library': [
    { to: '/library', label: 'Overview', icon: <LibraryIcon size={16} /> },
    {
      to: '/library/sounds',
      label: 'Sounds',
      icon: <ListMusicIcon size={16} />,
    },
    {
      to: '/library/collections',
      label: 'Collections',
      icon: <LayersIcon size={16} />,
    },
    {
      to: '/studio/releases',
      label: 'Releases',
      icon: <ListMusicIcon size={16} />,
    },
    { to: '/library/media', label: 'Media', icon: <ImageIcon size={16} /> },
    { to: '/library/upload', label: 'Upload', icon: <UploadIcon size={16} /> },
    {
      to: '/studio/editor',
      label: 'Editor',
      icon: <SlidersHorizontalIcon size={16} />,
    },
    { to: '/studio/stash', label: 'Stash', icon: <FolderOpenIcon size={16} /> },
  ],
  '/studio/go-live': [
    {
      to: '/studio/go-live',
      label: 'Go live',
      icon: <RadioTowerIcon size={16} />,
    },
    {
      to: '/studio/info',
      label: 'Info',
      icon: <InfoIcon size={16} />,
    },
    {
      to: '/studio/schedule',
      label: 'Schedule',
      icon: <RadioIcon size={16} />,
    },
    { to: '/studio/events', label: 'Events', icon: <RadioIcon size={16} /> },
    { to: '/studio/shows', label: 'Shows', icon: <RadioIcon size={16} /> },
  ],
  '/studio/channel': [
    {
      to: '/studio/channel',
      label: 'Channel',
      icon: <Settings2Icon size={16} />,
    },
    {
      to: '/sources',
      label: 'Sources',
      icon: <Link2Icon size={16} />,
    },
    {
      to: '/studio/channel?tab=radio',
      label: 'Radio',
      icon: <RadioIcon size={16} />,
    },
    {
      to: '/studio/channel?tab=green-room',
      label: 'Green room',
      icon: <MicIcon size={16} />,
    },
    {
      to: '/studio/channel?tab=multicast',
      label: 'Multicast',
      icon: <RadioTowerIcon size={16} />,
    },
    {
      to: '/studio/channel?tab=selects',
      label: 'Tahti Selects',
      icon: <ListMusicIcon size={16} />,
    },
    {
      to: '/studio/moderation',
      label: 'Moderation',
      icon: <SettingsIcon size={16} />,
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
    '/studio/stats',
    '/studio/governance',
    '/studio/updates',
    '/studio/distribution',
    '/studio/revenue',
  ],
  '/library': [
    '/library',
    '/studio/archive',
    '/studio/releases',
    '/library/collections',
    '/studio/collections',
    '/library/recordings',
    '/library/smartlinks',
    '/library/upload',
    '/studio/editor',
    '/studio/mastering',
    '/studio/stash',
  ],
  '/studio/go-live': [
    '/studio/go-live',
    '/studio/info',
    '/studio/schedule',
    '/studio/events',
    '/studio/shows',
  ],
  '/studio/channel': ['/studio/channel', '/sources', '/studio/moderation'],
};

const SUBMENU_SLOT_CLASS = 'min-h-0 sm:min-h-56';

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

const isSubmenuActive = (current: string | undefined, to: string) =>
  (to.includes('?')
    ? current === to
    : to === '/library' || to === '/studio'
      ? current === to
      : current === to || current?.startsWith(`${to}/`) === true) ||
  (to === '/studio/releases' && current === '/library/releases') ||
  (to === '/library/sounds' && current?.startsWith('/studio/archive')) ||
  (to === '/library/collections' &&
    (current === '/studio/collections' ||
      current?.startsWith('/studio/collections/') === true ||
      current?.startsWith('/studio/playlists/') === true)) ||
  (to === '/studio/recordings' && current === '/library/recordings') ||
  (to === '/library/history' && current === '/library/history');

export const StudioNav = ({ current }: { current?: string }) => (
  <StudioNavigation current={current} />
);

function StudioNavigation({ current }: { current?: string }) {
  const navigate = useNavigate();
  const routeSection = PRIMARY.find((item) => isActive(current, item.to));
  const selectedSection = routeSection?.to ?? '/studio';

  const submenu = SUBMENUS[selectedSection as keyof typeof SUBMENUS] ?? [];

  return (
    <div className="flex min-w-0 flex-col gap-1" data-studio-navigation>
      <div
        aria-label="Studio sections"
        className="border-border flex w-full max-w-full min-w-0 gap-1 overflow-x-auto rounded-lg border p-1"
        role="tablist"
        data-studio-section-tabs
      >
        {PRIMARY.map((item) => {
          const active = item.to === selectedSection;
          return (
            <button
              key={item.to}
              type="button"
              role="tab"
              aria-selected={active}
              className={`flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold whitespace-nowrap ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground-secondary hover:bg-background-secondary hover:text-foreground'
              }`}
              onClick={() => {
                void navigate({ to: item.to });
              }}
            >
              <span className="shrink-0">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </div>
      {submenu.length > 0 && (
        <div className={SUBMENU_SLOT_CLASS} data-studio-section-menu>
          <SectionSidebar
            aria-label={`${PRIMARY.find((item) => item.to === selectedSection)?.label ?? 'Studio'} pages`}
            items={submenu.map((item) => ({
              id: item.to,
              label: item.label,
              icon: item.icon,
              to: item.to,
              active: isSubmenuActive(current, item.to),
            }))}
          />
        </div>
      )}
    </div>
  );
}
