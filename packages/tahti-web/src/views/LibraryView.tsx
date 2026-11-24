import { useNavigate } from '@tanstack/react-router';
import {
  FolderIcon,
  HardDriveIcon,
  HeartIcon,
  HistoryIcon,
  ListMusicIcon,
  PackageIcon,
  UserPlusIcon,
} from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { FilterChips, TabLabel, Tabs, ViewShell } from '@tahti-player/ui';

import { DesktopLibraryPanel } from '../components/DesktopLibraryPanel';
import {
  PHONE_SCROLL_TAB_LIST,
  useSelectedTabInView,
} from '../components/SectionTabs';
import {
  isLibraryFileKind,
  LIBRARY_FILE_KINDS,
  type LibraryFileKind,
} from '../lib/libraryFileKinds';
import { getNativeLibrary } from '../lib/nativeLibrary';
import { useAuthStore } from '../stores/authStore';
import { FavoritesView } from './FavoritesView';
import { HistoryView } from './HistoryView';
import { LibraryFollowingView } from './LibraryFollowingView';
import { LibraryMediaView } from './LibraryMediaView';
import { LibraryPlaylistsView } from './LibraryPlaylistsView';
import { StudioStashView } from './studio/StudioStashView';

export type Tab = 'favorites' | 'playlists' | 'history' | 'following' | 'files';

/** Library is what a listener keeps. The artist catalog is Studio → Music. */
export const LIBRARY_SECTION_TABS = [
  {
    id: 'favorites' as const,
    labelKey: 'library.tabFavorites' as const,
    icon: HeartIcon,
    to: '/library/favorites',
  },
  {
    id: 'playlists' as const,
    labelKey: 'library.tabPlaylists' as const,
    icon: ListMusicIcon,
    to: '/library/playlists',
  },
  {
    id: 'history' as const,
    labelKey: 'library.tabHistory' as const,
    icon: HistoryIcon,
    to: '/library/history',
  },
  {
    id: 'following' as const,
    labelKey: 'library.tabFollowing' as const,
    icon: UserPlusIcon,
    to: '/library/following',
  },
  {
    id: 'files' as const,
    labelKey: 'library.tabFiles' as const,
    icon: HardDriveIcon,
    to: '/library/files',
  },
];

export type LibrarySectionId = (typeof LIBRARY_SECTION_TABS)[number]['id'];

/** A visitor can open Favorites. The rest need an account. */
const PUBLIC_LIBRARY_TABS: ReadonlySet<LibrarySectionId> = new Set([
  'favorites',
]);

function useLibraryTabs() {
  const signedOut = useAuthStore((state) => !state.user);
  return LIBRARY_SECTION_TABS.map((item) => ({
    ...item,
    disabled: signedOut && !PUBLIC_LIBRARY_TABS.has(item.id),
  }));
}

/** Library's tab strip, also shown by Library pages rendered outside
 * LibraryView so they keep the right tab lit. A file kind lights Files. */
export function LibrarySectionTabs({
  active: activeTab,
}: {
  active: LibrarySectionId | LibraryFileKind;
}) {
  const active = isLibraryFileKind(activeTab) ? 'files' : activeTab;
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const ref = useSelectedTabInView(active);
  const tabs = useLibraryTabs();
  return (
    <div ref={ref} className="min-w-0">
      <Tabs.Root
        variant="underline"
        selectedIndex={Math.max(
          0,
          tabs.findIndex((item) => item.id === active),
        )}
        onChange={(index) => {
          const next = tabs[index];
          if (next && !next.disabled) {
            void navigate({ to: next.to as never });
          }
        }}
      >
        <Tabs.List
          aria-label={t('library.sections')}
          className={`${PHONE_SCROLL_TAB_LIST} max-w-full pb-0`}
        >
          {tabs.map((item) => (
            <Tabs.Tab
              key={item.id}
              disabled={item.disabled}
              aria-label={
                item.disabled
                  ? t('library.needsAccount', { label: t(item.labelKey) })
                  : undefined
              }
            >
              <TabLabel icon={<item.icon size={14} />}>
                {t(item.labelKey)}
              </TabLabel>
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.Root>
    </div>
  );
}

const FILE_KIND_LABEL_KEYS = {
  media: 'library.tabMedia',
  stash: 'library.tabStash',
  local: 'library.tabLocal',
} as const satisfies Record<LibraryFileKind, string>;

const FILE_KIND_ICONS = {
  media: HardDriveIcon,
  stash: PackageIcon,
  local: FolderIcon,
} as const;

function LibraryFiles({ kind }: { kind: LibraryFileKind }) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const desktopLocal = Boolean(getNativeLibrary());
  const kinds = LIBRARY_FILE_KINDS.filter(
    (id) => desktopLocal || id !== 'local',
  );
  const shown = kinds.includes(kind) ? kind : 'media';
  return (
    <div className="mt-2 flex flex-col gap-4">
      <FilterChips
        aria-label={t('library.fileKinds')}
        items={kinds.map((id) => {
          const Icon = FILE_KIND_ICONS[id];
          return {
            id,
            label: t(FILE_KIND_LABEL_KEYS[id]),
            icon: <Icon size={14} aria-hidden />,
          };
        })}
        selected={shown}
        onChange={(next) => {
          void navigate({
            to: '/library/files',
            search: next === 'media' ? {} : { kind: next as LibraryFileKind },
            replace: true,
          });
        }}
      />
      {shown === 'media' ? <LibraryMediaView /> : null}
      {shown === 'stash' ? <StudioStashView embedded /> : null}
      {shown === 'local' ? (
        <div className="h-[28rem]">
          <DesktopLibraryPanel />
        </div>
      ) : null}
    </div>
  );
}

export function LibraryView({
  tab = 'favorites',
  kind = 'media',
}: {
  tab?: Tab;
  kind?: LibraryFileKind;
}) {
  const { t } = useTranslation('web');
  const libraryTitle = t(
    LIBRARY_SECTION_TABS.find((item) => item.id === tab)?.labelKey ??
      'library.tabFavorites',
  );

  return (
    <div className="studio-page-layout flex w-full flex-col gap-6">
      <LibrarySectionTabs active={tab} />
      {/* The active section tab already names the page; on phones the
          repeated title only pushes the content down. */}
      <ViewShell
        title={libraryTitle}
        classes={{ root: 'px-0 pt-0', title: 'max-sm:sr-only' }}
      >
        {tab === 'favorites' ? (
          <div className="mt-2">
            <FavoritesView embedded />
          </div>
        ) : null}
        {tab === 'playlists' ? <LibraryPlaylistsView /> : null}
        {tab === 'history' ? (
          <div className="mt-2">
            <HistoryView embedded />
          </div>
        ) : null}
        {tab === 'following' ? (
          <div className="mt-2">
            <LibraryFollowingView />
          </div>
        ) : null}
        {tab === 'files' ? <LibraryFiles kind={kind} /> : null}
      </ViewShell>
    </div>
  );
}
