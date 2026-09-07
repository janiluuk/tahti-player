import { useNavigate } from '@tanstack/react-router';
import {
  Code2Icon,
  FolderIcon,
  HardDriveIcon,
  HeadphonesIcon,
  LayoutGridIcon,
  LibraryIcon,
  Link2Icon,
  MicIcon,
  Music2Icon,
  PackageIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { TabLabel, Tabs, TopList, ViewShell } from '@tahti-player/ui';

import { fetchStudioSounds } from '../api/studio';
import {
  fetchStatsTopTracks,
  fetchStorageUsage,
  type StatsTopTrack,
  type StorageUsage,
} from '../api/studio-extras';
import { DesktopLibraryPanel } from '../components/DesktopLibraryPanel';
import { StudioPanel } from '../components/StudioPanel';
import { formatPlayCount } from '../lib/topListEntries';
import { LibraryEmbedsView } from './LibraryEmbedsView';
import { LibraryMediaView } from './LibraryMediaView';
import { LibrarySmartLinksView } from './LibrarySmartLinksView';
import { MyCollectionsView } from './MyCollectionsView';
import { MyDiscographyView } from './MyDiscographyView';
import { StudioRecordingsView } from './studio/StudioRecordingsView';
import { StudioStashView } from './studio/StudioStashView';

export type Tab =
  | 'library'
  | 'sounds'
  | 'collections'
  | 'recordings'
  | 'media'
  | 'stash'
  | 'embeds'
  | 'smartlinks'
  | 'local';

export const LIBRARY_SECTION_TABS = [
  {
    id: 'library' as const,
    label: 'Overview',
    icon: LayoutGridIcon,
    to: '/library',
  },
  {
    id: 'sounds' as const,
    label: 'Sounds',
    icon: Music2Icon,
    to: '/library/sounds',
  },
  {
    id: 'collections' as const,
    label: 'Collections',
    icon: LibraryIcon,
    to: '/library/collections',
  },
  {
    id: 'recordings' as const,
    label: 'Recordings',
    icon: MicIcon,
    to: '/library/recordings',
  },
  {
    id: 'media' as const,
    label: 'Media',
    icon: HardDriveIcon,
    to: '/library/media',
  },
  {
    id: 'stash' as const,
    label: 'Stash',
    icon: PackageIcon,
    to: '/library/stash',
  },
  {
    id: 'embeds' as const,
    label: 'Embeds',
    icon: Code2Icon,
    to: '/library/embeds',
  },
  {
    id: 'smartlinks' as const,
    label: 'Smart links',
    icon: Link2Icon,
    to: '/library/smartlinks',
  },
  {
    id: 'local' as const,
    label: 'Local files',
    icon: FolderIcon,
    to: '/library/local',
  },
];

export type LibrarySectionId = (typeof LIBRARY_SECTION_TABS)[number]['id'];

/**
 * The horizontal Overview/Sounds/Collections/... tab strip shown at the top
 * of every Library page. Reused outside LibraryView by pages that live one
 * level under a Library tab (e.g. an individual collection's detail page)
 * so they still show Library's top navigation with the right tab active.
 */
export function LibrarySectionTabs({ active }: { active: LibrarySectionId }) {
  const navigate = useNavigate();
  return (
    <Tabs.Root
      selectedIndex={Math.max(
        0,
        LIBRARY_SECTION_TABS.findIndex((item) => item.id === active),
      )}
      onChange={(index) => {
        const next = LIBRARY_SECTION_TABS[index];
        if (next) {
          void navigate({ to: next.to as never });
        }
      }}
    >
      <Tabs.List aria-label="Library sections" className="overflow-x-auto">
        {LIBRARY_SECTION_TABS.map((item) => (
          <Tabs.Tab key={item.id}>
            <TabLabel icon={<item.icon size={14} />}>{item.label}</TabLabel>
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}

export function LibraryView({ tab = 'library' }: { tab?: Tab }) {
  const navigate = useNavigate();

  const libraryTitle =
    tab === 'library'
      ? 'Overview'
      : tab === 'sounds'
        ? 'Sounds'
        : tab === 'recordings'
          ? 'Recordings'
          : tab === 'embeds'
            ? 'Embeds'
            : tab === 'media'
              ? 'Media'
              : tab === 'stash'
                ? 'Stash'
                : tab === 'smartlinks'
                  ? 'Smart links'
                  : tab === 'local'
                    ? 'Local files'
                    : 'Collections';

  return (
    <div className="studio-page-layout flex w-full flex-col gap-6">
      <LibrarySectionTabs active={tab} />
      <ViewShell title={libraryTitle} classes={{ root: 'px-0 pt-0' }}>
        {tab === 'library' ? (
          <div className="mt-2">
            <LibraryStats />
          </div>
        ) : null}
        {tab === 'sounds' ? (
          <div className="mt-2">
            <MyDiscographyView />
          </div>
        ) : null}
        {tab === 'collections' ? (
          <div className="mt-2">
            <MyCollectionsView embedded />
          </div>
        ) : null}
        {tab === 'recordings' ? (
          <div className="mt-2">
            <StudioRecordingsView embedded />
          </div>
        ) : null}
        {tab === 'media' ? (
          <div className="mt-2">
            <LibraryMediaView />
          </div>
        ) : null}
        {tab === 'stash' ? (
          <div className="mt-2">
            <StudioStashView embedded />
          </div>
        ) : null}
        {tab === 'embeds' ? (
          <div className="mt-2">
            <LibraryEmbedsView />
          </div>
        ) : null}
        {tab === 'smartlinks' ? <LibrarySmartLinksView /> : null}
        {tab === 'local' ? (
          <div className="mt-2 h-[28rem]">
            <DesktopLibraryPanel />
          </div>
        ) : null}
      </ViewShell>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 1024 * 1024 * 100 ? 0 : 1)} MB`;
}

function LibraryStats() {
  const navigate = useNavigate();
  const [topTracks, setTopTracks] = useState<StatsTopTrack[]>([]);
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [soundCount, setSoundCount] = useState(0);

  useEffect(() => {
    void Promise.all([fetchStatsTopTracks('all'), fetchStorageUsage()]).then(
      ([tracks, usage]) => {
        setTopTracks(tracks.data.slice(0, 3));
        setStorage(usage.data);
      },
    );
  }, []);

  useEffect(() => {
    void fetchStudioSounds().then((result) =>
      setSoundCount(result.data.length),
    );
  }, []);

  return (
    <StudioPanel
      title="Library overview"
      description="Your catalog at a glance."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border-border bg-background-secondary/40 rounded-lg border p-3">
          <Music2Icon size={18} className="text-primary" aria-hidden />
          <p className="text-foreground-secondary mt-2 text-xs uppercase">
            Total sounds
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{soundCount}</p>
        </div>
        <div className="border-border bg-background-secondary/40 rounded-lg border p-3">
          <HardDriveIcon size={18} className="text-primary" aria-hidden />
          <p className="text-foreground-secondary mt-2 text-xs uppercase">
            Storage used
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {storage ? formatBytes(storage.usedBytes) : '—'}
          </p>
          <p className="text-foreground-secondary text-xs">
            {storage?.unlimited
              ? 'Unlimited plan'
              : storage?.quotaBytes
                ? `of ${formatBytes(storage.quotaBytes)}`
                : 'Audio and files'}
          </p>
        </div>
        <div className="border-border bg-background-secondary/40 rounded-lg border p-3">
          <HeadphonesIcon size={18} className="text-primary" aria-hidden />
          <p className="text-foreground-secondary mt-2 text-xs uppercase">
            Top sound
          </p>
          <p className="mt-1 truncate text-sm font-bold">
            {topTracks[0]?.title ?? '—'}
          </p>
          <p className="text-foreground-secondary text-xs">
            {topTracks[0]
              ? formatPlayCount(topTracks[0].plays)
              : 'No plays yet'}
          </p>
        </div>
      </div>
      {topTracks.length > 0 ? (
        <div className="mt-4">
          <TopList
            title="Top sounds · all time"
            formatValue={formatPlayCount}
            entries={topTracks.map((track) => ({
              id: track.soundId,
              label: track.title,
              value: track.plays,
              onClick: () => {
                void navigate({
                  to: '/studio/sounds/$id',
                  params: { id: track.soundId },
                });
              },
            }))}
          />
        </div>
      ) : null}
    </StudioPanel>
  );
}
