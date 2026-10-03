import { useMemo, type ReactNode } from 'react';

import type { Track } from '@tahti-player/model';

import {
  ANNOTATED_ROW_HEIGHT,
  contributionLine,
} from '../../api/collection-contribution';
import type { StudioCollectionItem } from '../../api/studio-types';
import { CollectionContribution } from '../../components/CollectionContribution';
import { useAuthStore } from '../../stores/authStore';

type StudioContributions = {
  rowHeight?: number;
  getTrackAnnotation?: (track: Track) => ReactNode;
};

/** "Added by @username" and the contributor's note for the owner's
 * collection editor rows, keyed like `collectionItemToTrack` (item id). */
export function useStudioContributions(
  items: StudioCollectionItem[],
): StudioContributions {
  const ownerUsername = useAuthStore((s) => s.user?.username);

  return useMemo(() => {
    // Without the owner's username their own adds would be credited too.
    if (!ownerUsername) {
      return {};
    }
    const lines = new Map(
      items.flatMap((item) => {
        const line = contributionLine(item, ownerUsername);
        return line ? [[item.id, line] as const] : [];
      }),
    );
    if (lines.size === 0) {
      return {};
    }
    return {
      rowHeight: ANNOTATED_ROW_HEIGHT,
      getTrackAnnotation: (track: Track) => {
        const line = lines.get(track.source.id);
        return line ? <CollectionContribution line={line} /> : null;
      },
    };
  }, [items, ownerUsername]);
}
