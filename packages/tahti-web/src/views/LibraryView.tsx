import { Link } from '@tanstack/react-router';
import { HardDriveIcon, HeadphonesIcon, Music2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { fetchStudioSounds } from '../api/studio';
import {
  fetchStatsTopTracks,
  fetchStorageUsage,
  type StatsTopTrack,
  type StorageUsage,
} from '../api/studio-extras';
import { StudioNav } from '../components/StudioNav';
import { StudioPageHeader, StudioPanel } from '../components/StudioPanel';
import { LibraryEmbedsView } from './LibraryEmbedsView';
import { LibraryMediaView } from './LibraryMediaView';
import { LibrarySmartLinksView } from './LibrarySmartLinksView';
import { MyCollectionsView } from './MyCollectionsView';
import { MyDiscographyView } from './MyDiscographyView';
import { StudioRecordingsView } from './studio/StudioRecordingsView';
import { StudioStashView } from './studio/StudioStashView';

type Tab = 'library' | 'sounds' | 'collections' | 'smartlinks' | 'media';

type CollectionTab =
  | 'collections'
  | 'recordings'
  | 'media'
  | 'stash'
  | 'embeds';

const LIBRARY_ROUTE_BY_TAB: Record<Tab, string> = {
  library: '/library',
  sounds: '/library/sounds',
  collections: '/library/collections',
  smartlinks: '/library/smartlinks',
  media: '/library/media',
};

const libraryNavRoute = (tab: Tab): string =>
  tab === 'media' ? '/library/collections' : LIBRARY_ROUTE_BY_TAB[tab];

export function LibraryView({
  tab = 'library',
  collectionTab,
}: {
  tab?: Tab;
  collectionTab?: CollectionTab;
}) {
  const activeCollectionTab = collectionTab ?? tab;
  const overviewTab =
    tab === 'sounds' ||
    tab === 'smartlinks' ||
    activeCollectionTab === 'collections' ||
    activeCollectionTab === 'recordings' ||
    activeCollectionTab === 'media' ||
    activeCollectionTab === 'stash' ||
    activeCollectionTab === 'embeds'
      ? activeCollectionTab === 'smartlinks'
        ? 'smartlinks'
        : activeCollectionTab
      : null;

  return (
    <div className="studio-page-layout flex w-full flex-col gap-6">
      <StudioNav current={libraryNavRoute(tab)} />
      {tab === 'library' ? (
        <>
          <StudioPageHeader
            title="Overview"
            subtitle="Your catalog at a glance."
          />
          <div className="mt-6">
            <LibraryStats />
          </div>
        </>
      ) : null}
      {overviewTab ? (
        <>
          <StudioPageHeader
            title={
              overviewTab === 'sounds'
                ? 'Sounds'
                : overviewTab === 'recordings'
                  ? 'Recordings'
                  : overviewTab === 'embeds'
                    ? 'Embeds'
                    : overviewTab === 'media'
                      ? 'Media'
                      : overviewTab === 'stash'
                        ? 'Stash'
                        : overviewTab === 'smartlinks'
                          ? 'Smart links'
                          : 'Collections'
            }
            subtitle="Your sounds, collections, recordings, media, and imported embeds."
          />
          <nav
            aria-label="Library sections"
            className="border-border mt-4 flex w-full gap-1 overflow-x-auto border-b"
            role="tablist"
          >
            {(
              [
                ['sounds', 'Sounds', '/library/sounds'],
                ['collections', 'Collections', '/library/collections'],
                [
                  'recordings',
                  'Recordings',
                  '/library/collections?tab=recordings',
                ],
                ['media', 'Media', '/library/collections?tab=media'],
                ['stash', 'Stash', '/library/collections?tab=stash'],
                ['embeds', 'Embeds', '/library/collections?tab=embeds'],
                ['smartlinks', 'Smart links', '/library/smartlinks'],
              ] as const
            ).map(([id, label, to]) => (
              <Link
                key={id}
                to={to as never}
                role="tab"
                aria-selected={overviewTab === id}
                className={`border-b-2 px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                  overviewTab === id
                    ? 'border-primary text-foreground'
                    : 'text-foreground-secondary hover:text-foreground border-transparent'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          {tab === 'sounds' && (
            <div className="mt-6">
              <MyDiscographyView />
            </div>
          )}
          {overviewTab === 'collections' && (
            <div className="mt-6">
              <MyCollectionsView embedded />
            </div>
          )}
          {overviewTab === 'recordings' && (
            <div className="mt-6">
              <StudioRecordingsView embedded />
            </div>
          )}
          {overviewTab === 'media' && (
            <div className="mt-6">
              <LibraryMediaView />
            </div>
          )}
          {overviewTab === 'stash' && (
            <div className="mt-6">
              <StudioStashView embedded />
            </div>
          )}
          {overviewTab === 'embeds' && (
            <div className="mt-6">
              <LibraryEmbedsView />
            </div>
          )}
        </>
      ) : null}
      {tab === 'smartlinks' && <LibrarySmartLinksView />}
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
              ? `${topTracks[0].plays.toLocaleString()} plays`
              : 'No plays yet'}
          </p>
        </div>
      </div>
      {topTracks.length > 0 ? (
        <div className="mt-4">
          <p className="text-foreground-secondary mb-2 text-xs font-semibold uppercase">
            Top sounds · all time
          </p>
          <ol className="divide-border divide-y">
            {topTracks.map((track, index) => (
              <li
                key={track.soundId}
                className="flex items-center gap-3 py-2 text-sm"
              >
                <span className="text-foreground-secondary w-5 text-center text-xs">
                  {index + 1}
                </span>
                <Link
                  to="/studio/sounds/$id"
                  params={{ id: track.soundId }}
                  className="min-w-0 flex-1 truncate hover:underline"
                >
                  {track.title}
                </Link>
                <span className="text-foreground-secondary text-xs">
                  {track.plays.toLocaleString()} plays
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </StudioPanel>
  );
}
