import { ArrowUpDownIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import {
  fetchAdminCollection,
  reorderAdminCollectionItems,
} from '../api/admin/admin-collections';
import type {
  CollectionTrackSortMode,
  StudioCollectionItem,
} from '../api/studio-types';
import { sortableCollectionItems } from '../lib/saveCollectionSoundOrder';
import { soundSortModeFromApi } from '../lib/sortSounds';
import { SortSoundsDialog } from './SortSoundsDialog';

/** Sort sounds for a board member on any artist's album. The admin copy
 * lists private tracks too, so the saved order names every item once. Only
 * the order is saved; the album's public sort mode stays the owner's call. */
export function BoardCollectionSortSounds({
  slug,
  onSaved,
}: {
  slug: string;
  onSaved: () => void;
}) {
  const { t } = useTranslation('web');
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<{
    items: StudioCollectionItem[];
    trackSortMode: CollectionTrackSortMode;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchAdminCollection(slug).then((result) => {
      if (!cancelled && result.ok) {
        setState({
          items: [...(result.data.items ?? [])].sort(
            (a, b) => a.position - b.position,
          ),
          trackSortMode: result.data.trackSortMode ?? 'MANUAL',
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const sounds = useMemo(
    () => sortableCollectionItems(state?.items ?? []),
    [state],
  );

  if (!state || state.items.length < 2) {
    return null;
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <ArrowUpDownIcon size={16} aria-hidden className="mr-1.5" />
        {t('sortSounds.boardOpen')}
      </Button>
      <SortSoundsDialog
        isOpen={open}
        sounds={sounds}
        initialMode={soundSortModeFromApi(state.trackSortMode)}
        onSave={async (ids) => {
          const result = await reorderAdminCollectionItems(slug, ids);
          if (!result.ok) {
            return result;
          }
          const byId = new Map(state.items.map((item) => [item.id, item]));
          setState({
            ...state,
            items: ids.flatMap((id) => byId.get(id) ?? []),
          });
          onSaved();
          return { ok: true };
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
