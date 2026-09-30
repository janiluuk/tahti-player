import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

import { Input } from '@tahti-player/ui';

import { addTrackToCollaborativePlaylist } from '../api/catalog-search';
import { useAuthStore } from '../stores/authStore';
import { CatalogTrackSearch } from './CatalogTrackSearch';
import { Eyebrow } from './tahti/Eyebrow';

export function CollaborativePlaylistAdd({
  slug,
  existingSoundIds,
  onAdded,
}: {
  slug: string;
  existingSoundIds: readonly string[];
  onAdded: () => void;
}) {
  const signedIn = Boolean(useAuthStore((state) => state.user));
  const [note, setNote] = useState('');

  return (
    <section aria-label="Add to this playlist" className="flex flex-col gap-2">
      <h2>
        <Eyebrow>Add to this playlist</Eyebrow>
      </h2>
      {signedIn ? (
        <>
          <p className="text-foreground-secondary text-xs">
            Anyone signed in can add a public track to this collaborative
            playlist. The owner gets a notification.
          </p>
          <Input
            label="Note (optional)"
            value={note}
            maxLength={200}
            placeholder="Why this track?"
            onChange={(event) => setNote(event.target.value)}
          />
          <CatalogTrackSearch
            excludeIds={existingSoundIds}
            onAdd={async (track) => {
              const result = await addTrackToCollaborativePlaylist(
                slug,
                track.id,
                note,
              );
              if (!result.ok) {
                toast.error(result.error);
                return false;
              }
              toast.success(`Added ${track.title}.`);
              setNote('');
              onAdded();
              return true;
            }}
          />
        </>
      ) : (
        <p className="text-foreground-secondary text-sm">
          <Link to="/login" className="underline">
            Sign in
          </Link>{' '}
          to add tracks to this collaborative playlist.
        </p>
      )}
    </section>
  );
}
