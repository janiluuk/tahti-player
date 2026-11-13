import { useNavigate } from '@tanstack/react-router';
import {
  FolderIcon,
  HardDriveIcon,
  HeartIcon,
  HistoryIcon,
  PackageIcon,
} from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { TabLabel, Tabs, ViewShell } from '@tahti-player/ui';

import { DesktopLibraryPanel } from '../components/DesktopLibraryPanel';
import {
  PHONE_SCROLL_TAB_LIST,
  useSelectedTabInView,
} from '../components/SectionTabs';
import { getNativeLibrary } from '../lib/nativeLibrary';
import { useAuthStore } from '../stores/authStore';
import { FavoritesView } from './FavoritesView';
import { HistoryView } from './HistoryView';
import { LibraryMediaView } from './LibraryMediaView';
import { StudioStashView } from './studio/StudioStashView';

export type Tab = 'favorites' | 'history' | 'media' | 'stash' | 'local';

/** Library is what a listener keeps. The artist catalog is Studio → Music. */
export const LIBRARY_SECTION_TABS = [
  {
    id: 'favorites' as const,
    labelKey: 'library.tabFavorites' as const,
    icon: HeartIcon,
    to: '/library/favorites',
  },
  {
    id: 'history' as const,
    labelKey: 'library.tabHistory' as const,
    icon: HistoryIcon,
    to: '/library/history',
  },
  {
    id: 'media' as const,
    labelKey: 'library.tabMedia' as const,
    icon: HardDriveIcon,
    to: '/library/media',
  },
  {
    id: 'stash' as const,
    labelKey: 'library.tabStash' as const,
    icon: PackageIcon,
    to: '/library/stash',
  },
  {
    id: 'local' as const,
    labelKey: 'library.tabLocal' as const,
    icon: FolderIcon,
    to: '/library/local',
  },
];

export type LibrarySectionId = (typeof LIBRARY_SECTION_TABS)[number]['id'];

/** A visitor can open Favorites. The rest need an account. */
const PUBLIC_LIBRARY_TABS: ReadonlySet<LibrarySectionId> = new Set([
  'favorites',
]);

function useLibraryTabs() {
  const signedOut = useAuthStore((state) => !state.user);
  // Local files is the desktop native library — hide on plain web.
  const desktopLocal = Boolean(getNativeLibrary());
  return LIBRARY_SECTION_TABS.filter(
    (item) => desktopLocal || item.id !== 'local',
  ).map((item) => ({
    ...item,
    disabled: signedOut && !PUBLIC_LIBRARY_TABS.has(item.id),
  }));
}

/** Library's tab strip, also shown by Library pages rendered outside
 * LibraryView so they keep the right tab lit. */
export function LibrarySectionTabs({ active }: { active: LibrarySectionId }) {
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

export function LibraryView({ tab = 'favorites' }: { tab?: Tab }) {
  const { t } = useTranslation('web');
  const libraryTitle = t(
    LIBRARY_SECTION_TABS.find((item) => item.id === tab)?.labelKey ??
      'library.tabFavorites',
  );

  return (
    <div className="studio-page-layout flex w-full flex-col gap-6">
      <LibrarySectionTabs active={tab} />
      <ViewShell title={libraryTitle} classes={{ root: 'px-0 pt-0' }}>
        {tab === 'favorites' ? (
          <div className="mt-2">
            <FavoritesView embedded />
          </div>
        ) : null}
        {tab === 'history' ? (
          <div className="mt-2">
            <HistoryView embedded />
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
        {tab === 'local' ? (
          <div className="mt-2 h-[28rem]">
            <DesktopLibraryPanel />
          </div>
        ) : null}
      </ViewShell>
    </div>
  );
}
