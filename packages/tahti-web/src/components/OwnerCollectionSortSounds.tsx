import { useEffect, useState } from 'react';

import { fetchStudioCollection } from '../api/studio';
import type {
  CollectionTrackSortMode,
  StudioCollectionItem,
} from '../api/studio-types';
import { CollectionSortSounds } from './CollectionSortSounds';

/** Sort sounds on the owner's public collection page. The public collection
 * carries neither item ids nor the sort mode, so the owner's Studio copy is
 * loaded first; nothing renders until it arrives or when it has under two
 * items. */
export function OwnerCollectionSortSounds({
  slug,
  onSaved,
}: {
  slug: string;
  onSaved: () => void;
}) {
  const [state, setState] = useState<{
    items: StudioCollectionItem[];
    trackSortMode: CollectionTrackSortMode;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchStudioCollection(slug)
      .then((res) => {
        if (!cancelled) {
          setState({
            items: res.data.items ?? [],
            trackSortMode: res.data.trackSortMode ?? 'MANUAL',
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!state || state.items.length < 2) {
    return null;
  }

  return (
    <CollectionSortSounds
      slug={slug}
      items={state.items}
      trackSortMode={state.trackSortMode}
      onSaved={(items, trackSortMode) => {
        setState({ items, trackSortMode });
        onSaved();
      }}
    />
  );
}
