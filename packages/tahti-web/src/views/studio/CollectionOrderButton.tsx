import { ListOrderedIcon } from 'lucide-react';
import { useCallback, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Tooltip } from '@tahti-player/ui';

import { reorderProfileCollections } from '../../api/profile-order';
import { fetchStudioCollections } from '../../api/studio';
import { ProfileOrderDialog } from '../../components/ProfileOrderDialog';
import { publicCollectionsInProfileOrder } from '../../lib/profileCollectionOrder';

export function CollectionOrderButton({
  open: openProp,
  onOpenChange,
  hideTrigger = false,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
} = {}) {
  const { t } = useTranslation('web');
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const load = useCallback(async () => {
    const { data, meta } = await fetchStudioCollections();
    return {
      items: publicCollectionsInProfileOrder(data).map((c) => ({
        id: c.slug,
        title: c.name,
      })),
      error: meta.source === 'api' ? (meta.reason ?? null) : null,
    };
  }, []);

  return (
    <>
      {hideTrigger ? null : (
        <Tooltip content={t('library.collectionOrderTooltip')} side="top">
          <Button
            size="icon-sm"
            variant="secondary"
            aria-label={t('library.collectionOrderAria')}
            onClick={() => setOpen(true)}
          >
            <ListOrderedIcon size={16} aria-hidden />
          </Button>
        </Tooltip>
      )}
      <ProfileOrderDialog
        isOpen={open}
        title={t('library.collectionOrderTitle')}
        description={t('library.collectionOrderDescription')}
        empty={t('library.collectionOrderEmpty')}
        load={load}
        save={reorderProfileCollections}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
