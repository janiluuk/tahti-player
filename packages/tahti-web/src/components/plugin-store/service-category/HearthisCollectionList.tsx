import { CheckSquareIcon, FolderDownIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, MediaArtwork, Toggle, Tooltip } from '@tahti-player/ui';

import type { HearthisLibrary } from '../../../api/sources';

export type HearthisCollection =
  NonNullable<HearthisLibrary>['collections'][number];

type Props = {
  collections: HearthisCollection[];
  selected: Set<string>;
  busy: boolean;
  onToggle: (id: string) => void;
  onImportCollection: (collection: HearthisCollection) => void;
  onSelectAll: () => void;
  onImportSelected: () => void;
};

export function HearthisCollectionList({
  collections,
  selected,
  busy,
  onToggle,
  onImportCollection,
  onSelectAll,
  onImportSelected,
}: Props) {
  const { t } = useTranslation('web');
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {collections.map((collection) => (
        <li
          key={collection.id}
          className="border-border flex items-center gap-3 rounded-lg border p-3"
        >
          <Toggle
            label={t('hearthisCardBatch34.selectItem', {
              title: collection.title,
            })}
            checked={selected.has(collection.id)}
            onChange={() => onToggle(collection.id)}
          />
          <MediaArtwork
            size="thumb"
            src={collection.coverUrl}
            alt={collection.title}
            imageReveal={false}
            className="border-border shrink-0 rounded border"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{collection.title}</p>
            <p className="text-foreground-secondary text-xs">
              {t('hearthisCardBatch34.itemCount', {
                count: collection.trackCount,
              })}
            </p>
          </div>
          <Tooltip
            content={t('hearthisCardStates.importAsCollection')}
            side="top"
          >
            <Button
              size="icon-sm"
              variant="secondary"
              disabled={busy}
              onClick={() => onImportCollection(collection)}
              aria-label={t('hearthisCardBatch34.importAsCollectionNamed', {
                title: collection.title,
              })}
            >
              <FolderDownIcon size={15} />
            </Button>
          </Tooltip>
        </li>
      ))}
      {collections.length > 0 && (
        <li className="flex flex-wrap justify-end gap-2 sm:col-span-2">
          <Button size="sm" variant="secondary" onClick={onSelectAll}>
            <CheckSquareIcon size={15} className="mr-1.5" aria-hidden />
            {t('hearthisCardStates.selectAll')}
          </Button>
          <Button
            size="sm"
            disabled={busy || selected.size === 0}
            onClick={onImportSelected}
          >
            <FolderDownIcon size={15} className="mr-1.5" aria-hidden />
            {t('hearthisCardBatch34.importSelected', {
              count: selected.size,
            })}
          </Button>
        </li>
      )}
    </ul>
  );
}
