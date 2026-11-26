import {
  DiscAlbumIcon,
  HeadphonesIcon,
  ImagesIcon,
  MonitorPlayIcon,
  PaintbrushIcon,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';

import { useTranslation } from '@tahti-player/i18n';

import type { PublicProfile } from '../../api/types';
import type { ArtistLookBlockId } from '../../lib/channelLookElements';
import { collectionsOfKind } from '../../lib/collectionKind';
import { isPinned } from '../../lib/pinnedTracks';
import type {
  ArtistProfileTab,
  ArtistProfileTabItem,
} from './ArtistProfileTabs';

/** Tabs the artist page shows for this profile; falls back to the first
 * available tab when the active one disappears. */
export function useArtistProfileTabs({
  profile,
  lookVisibility,
  hasGallery,
  isOwner,
  tab,
  setTab,
}: {
  profile: PublicProfile | null;
  lookVisibility: Record<ArtistLookBlockId, boolean>;
  hasGallery: boolean;
  isOwner: boolean;
  tab: ArtistProfileTab;
  setTab: (tab: ArtistProfileTab) => void;
}): ArtistProfileTabItem[] {
  const { t } = useTranslation('web');
  const tabs = useMemo(() => {
    const list: ArtistProfileTabItem[] = [];
    if (!profile) {
      return list;
    }
    if (
      profile.tracks.length > 0 &&
      (lookVisibility.player || profile.tracks.some((t) => isPinned(t)))
    ) {
      list.push({
        id: 'stage',
        label: t('artistProfilePage.stage'),
        icon: MonitorPlayIcon,
      });
    }
    if (collectionsOfKind(profile.collections, 'album').length > 0) {
      list.push({
        id: 'albums',
        label: t('artistProfilePage.albums'),
        icon: DiscAlbumIcon,
      });
    }
    if (collectionsOfKind(profile.collections, 'dj-set').length > 0) {
      list.push({
        id: 'dj-sets',
        label: t('artistProfilePage.djSets'),
        icon: HeadphonesIcon,
      });
    }
    if (hasGallery) {
      list.push({
        id: 'gallery',
        label: t('artistProfilePage.gallery'),
        icon: ImagesIcon,
      });
    }
    if (isOwner) {
      list.push({
        id: 'design',
        label: t('artistProfilePage.design'),
        icon: PaintbrushIcon,
      });
    }
    return list;
  }, [hasGallery, isOwner, lookVisibility, profile]);

  useEffect(() => {
    if (profile && !tabs.some((item) => item.id === tab)) {
      setTab(tabs[0]?.id ?? 'stage');
    }
  }, [profile, tab, tabs]);

  return tabs;
}
