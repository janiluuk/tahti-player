import { ListOrderedIcon } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button } from '@tahti-player/ui';

import { fetchProfile } from '../../../api/client';
import { reorderPublicTracks } from '../../../api/profile-order';
import { ProfileOrderDialog } from '../../../components/ProfileOrderDialog';
import { useAuthStore } from '../../../stores/authStore';

export function TrackOrderButton() {
  const username = useAuthStore((s) => s.user?.username);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!username) {
      return [];
    }
    const { data } = await fetchProfile(username);
    return data.tracks.map((track) => ({ id: track.id, title: track.title }));
  }, [username]);

  if (!username) {
    return null;
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <ListOrderedIcon size={14} aria-hidden className="mr-1.5" />
        Order on your profile
      </Button>
      <ProfileOrderDialog
        isOpen={open}
        title="Track order on your profile"
        description="Public tracks appear in this order on your artist page's Tracks tab. Pinned tracks still show first, and new uploads start at the top."
        empty="No public tracks yet."
        load={load}
        save={reorderPublicTracks}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
