import { PlusIcon } from 'lucide-react';
import { useState } from 'react';

import { Button, Input, Toggle } from '@tahti-player/ui';

import { addMikseriTrack } from '../../../api/sources';
import { StudioPanel } from '../../../components/StudioPanel';
import { mikseriTrackEmbedUrl } from '../../../content/listenerWidgets';
import { toastWithUndo } from '../../../lib/undoToast';

export function MikseriImportPanel({
  collectionId,
  onAdded,
  onUndoAdd,
}: {
  collectionId: string;
  onAdded: () => void;
  onUndoAdd: (
    soundId: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [trackUrl, setTrackUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [genre, setGenre] = useState('');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!mikseriTrackEmbedUrl(trackUrl)) {
      setError(
        'Paste a Mikseri track page, official track embed, or numeric track ID.',
      );
      return;
    }
    if (!rightsConfirmed) {
      setError(
        'Confirm that you own the track or have permission to embed it.',
      );
      return;
    }
    setBusy(true);
    setError(null);
    const result = await addMikseriTrack({
      collectionId,
      trackUrl: trackUrl.trim(),
      title: title.trim(),
      artistName: artistName.trim(),
      genre: genre.trim() || undefined,
      rightsConfirmed: true,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const addedTitle = title.trim();
    toastWithUndo(`${addedTitle} added from Mikseri.net.`, {
      undo: () => onUndoAdd(result.data.soundId),
      undoneMessage: `${addedTitle} removed.`,
    });
    setTrackUrl('');
    setTitle('');
    setGenre('');
    setRightsConfirmed(false);
    onAdded();
  };

  return (
    <StudioPanel
      title="Add your music from Mikseri.net"
      description="Tahti stores the official embed reference and your metadata; it never copies the audio."
    >
      <form
        className="grid gap-3 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Input
          label="Mikseri track"
          value={trackUrl}
          onChange={(event) => setTrackUrl(event.target.value)}
          placeholder="Track page, embed URL, or track ID"
          required
        />
        <Input
          label="Track title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
        <Input
          label="Artist name"
          value={artistName}
          onChange={(event) => setArtistName(event.target.value)}
          required
        />
        <Input
          label="Genre"
          value={genre}
          onChange={(event) => setGenre(event.target.value)}
          description="Optional; used by collection filters."
        />
        <div className="flex items-center justify-between gap-3 md:col-span-2">
          <span className="text-sm">
            I own this track or have permission to embed it
          </span>
          <Toggle
            label="Rights confirmed"
            checked={rightsConfirmed}
            onChange={setRightsConfirmed}
          />
        </div>
        {error ? (
          <p className="text-destructive text-sm md:col-span-2" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          size="sm"
          className="justify-self-start"
          disabled={
            busy || !trackUrl.trim() || !title.trim() || !artistName.trim()
          }
        >
          <PlusIcon size={15} aria-hidden />
          {busy ? 'Adding…' : 'Add embed'}
        </Button>
      </form>
    </StudioPanel>
  );
}
