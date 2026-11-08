import { ArrowUpDownIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Tooltip } from '@tahti-player/ui';

import type {
  CollectionTrackSortMode,
  StudioCollectionItem,
} from '../api/studio-types';
import {
  saveCollectionSoundOrder,
  sortableCollectionItems,
} from '../lib/saveCollectionSoundOrder';
import { soundSortModeFromApi } from '../lib/sortSounds';
import { SortSoundsDialog } from './SortSoundsDialog';

/** The Sort sounds icon button and its dialog for one collection. */
export function CollectionSortSounds({
  slug,
  items,
  trackSortMode,
  onSaved,
}: {
  slug: string;
  items: StudioCollectionItem[];
  trackSortMode: CollectionTrackSortMode;
  onSaved: (
    items: StudioCollectionItem[],
    trackSortMode: CollectionTrackSortMode,
  ) => void;
}) {
  const { t } = useTranslation('web');
  const [open, setOpen] = useState(false);
  const sounds = useMemo(() => sortableCollectionItems(items), [items]);

  return (
    <>
      <Tooltip content={t('sortSounds.open')} side="top">
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label={t('sortSounds.open')}
          onClick={() => setOpen(true)}
        >
          <ArrowUpDownIcon size={16} aria-hidden />
        </Button>
      </Tooltip>
      <SortSoundsDialog
        isOpen={open}
        sounds={sounds}
        initialMode={soundSortModeFromApi(trackSortMode)}
        onSave={async (ids, mode) => {
          const result = await saveCollectionSoundOrder({
            slug,
            items,
            ids,
            mode,
            currentMode: trackSortMode,
          });
          if (!result.ok) {
            return result;
          }
          onSaved(result.items, result.trackSortMode);
          return { ok: true };
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
