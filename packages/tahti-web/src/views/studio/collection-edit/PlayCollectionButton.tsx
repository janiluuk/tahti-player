import { LoaderCircleIcon, PlayIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Tooltip } from '@tahti-player/ui';

import { fetchStudioCollection } from '../../../api/studio';
import type { TahtiPlayable } from '../../../api/types';
import { usePlayerStore } from '../../../stores/playerStore';
import { buildPlayable } from './useCollectionPlayback';

/** Plays a collection from a list row, where the row carries no items: the
 * collection is fetched first, then its playable sounds go to the queue in
 * tracklist order. */
export function PlayCollectionButton({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const [busy, setBusy] = useState(false);

  const playCollection = async () => {
    setBusy(true);
    try {
      const { data, meta } = await fetchStudioCollection(slug);
      if (meta.reason && !data.items?.length) {
        toast.error(`Could not load ${name}.`);
        return;
      }
      const sounds = (data.items ?? [])
        .filter((item) => item.sound && !item.unavailable)
        .map((item) => item.sound!);
      const playables = (
        await Promise.all(
          sounds.map((sound) => buildPlayable(sound).catch(() => null)),
        )
      ).filter((playable): playable is TahtiPlayable => playable !== null);
      const [first, ...rest] = playables;
      if (!first) {
        toast.info(`${name} has no playable tracks yet.`);
        return;
      }
      usePlayerStore.getState().play(first, { enqueueRest: rest });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Tooltip content="Play" side="top">
      <Button
        size="icon-sm"
        variant="text"
        aria-label={`Play ${name}`}
        disabled={busy}
        onClick={() => void playCollection()}
      >
        {busy ? (
          <LoaderCircleIcon size={16} aria-hidden className="animate-spin" />
        ) : (
          <PlayIcon size={16} aria-hidden />
        )}
      </Button>
    </Tooltip>
  );
}
