import { HardDriveDownloadIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@tahti-player/ui';

import { importHearthisEmbedAudio } from '../../api/embed-import';

export function HearthisEmbedImport({ soundId }: { soundId: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'started'>('idle');
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setState('busy');
    setError(null);
    const result = await importHearthisEmbedAudio(soundId);
    if (!result.ok) {
      setState('idle');
      setError(result.error);
      return;
    }
    setState('started');
  };

  return (
    <div className="border-border flex items-start gap-3 rounded-lg border p-3 text-sm">
      <div className="min-w-0 flex-1">
        <span className="block font-medium">Host the audio on Tahti</span>
        <span
          className="text-foreground-secondary block text-xs"
          data-testid="hearthis-import-status"
        >
          {state === 'started'
            ? 'Importing — the track switches to Tahti-hosted audio when it finishes.'
            : 'Copy this track’s audio from hearthis.at so it plays without the embed. Only works when downloads are on for it at hearthis.at.'}
        </span>
        {error ? (
          <span className="text-accent-red-strong mt-1 block text-xs">
            {error}
          </span>
        ) : null}
      </div>
      <Button
        size="sm"
        variant="secondary"
        disabled={state !== 'idle'}
        onClick={() => void run()}
      >
        <HardDriveDownloadIcon size={15} aria-hidden className="mr-1.5" />
        {state === 'busy' ? 'Starting…' : 'Import audio'}
      </Button>
    </div>
  );
}
