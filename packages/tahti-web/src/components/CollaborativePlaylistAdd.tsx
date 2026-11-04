import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Input } from '@tahti-player/ui';

import {
  addTrackToCollaborativePlaylist,
  removeOwnCollaborativeAdd,
} from '../api/catalog-search';
import { toastWithUndo } from '../lib/undoToast';
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
  const { t } = useTranslation('web');
  const signedIn = Boolean(useAuthStore((state) => state.user));
  const [note, setNote] = useState('');

  return (
    <section
      aria-label={t('collaborativePlaylist.title')}
      className="flex flex-col gap-2"
    >
      <h2>
        <Eyebrow>{t('collaborativePlaylist.title')}</Eyebrow>
      </h2>
      {signedIn ? (
        <>
          <p className="text-foreground-secondary text-xs">
            {t('collaborativePlaylist.signedInHint')}
          </p>
          <Input
            label={t('collaborativePlaylist.noteLabel')}
            value={note}
            maxLength={200}
            placeholder={t('collaborativePlaylist.notePlaceholder')}
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
              const { itemId } = result;
              if (itemId) {
                toastWithUndo(t('toasts.addedNamed', { title: track.title }), {
                  undo: () => removeOwnCollaborativeAdd(slug, itemId),
                  undoneMessage: t('toasts.removedNamed', {
                    title: track.title,
                  }),
                  onUndone: () => onAdded(),
                });
              } else {
                toast.success(t('toasts.addedNamed', { title: track.title }));
              }
              setNote('');
              onAdded();
              return true;
            }}
          />
        </>
      ) : (
        <p className="text-foreground-secondary text-sm">
          <Link to="/login" className="underline">
            {t('actions.signIn')}
          </Link>{' '}
          {t('collaborativePlaylist.signInPrompt')}
        </p>
      )}
    </section>
  );
}
