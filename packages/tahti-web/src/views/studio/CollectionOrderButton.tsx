import { ListOrderedIcon } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button, Tooltip } from '@tahti-player/ui';

import { reorderProfileCollections } from '../../api/profile-order';
import { fetchStudioCollections } from '../../api/studio';
import { ProfileOrderDialog } from '../../components/ProfileOrderDialog';
import { publicCollectionsInProfileOrder } from '../../lib/profileCollectionOrder';

export function CollectionOrderButton() {
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await fetchStudioCollections();
    return publicCollectionsInProfileOrder(data).map((c) => ({
      id: c.slug,
      title: c.name,
    }));
  }, []);

  return (
    <>
      <Tooltip content="Order on your profile" side="top">
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label="Order collections on your profile"
          onClick={() => setOpen(true)}
        >
          <ListOrderedIcon size={16} aria-hidden />
        </Button>
      </Tooltip>
      <ProfileOrderDialog
        isOpen={open}
        title="Collection order on your profile"
        description="Public collections appear in this order on your artist page. Featured collections stay first."
        empty="No public collections yet."
        load={load}
        save={reorderProfileCollections}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
