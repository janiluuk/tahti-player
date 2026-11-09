import { HardDriveDownloadIcon } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import { importHearthisEmbedAudio } from '../../api/embed-import';

export function HearthisEmbedImport({ soundId }: { soundId: string }) {
  const { t } = useTranslation('web');
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
        <span className="block font-medium">
          {t('hearthisEmbedImportText.hostTheAudioOnTahti')}
        </span>
        <span
          className="text-foreground-secondary block text-xs"
          data-testid="hearthis-import-status"
        >
          {state === 'started'
            ? t('hearthisEmbedImportStates.importingTheTrackSwitchesTo')
            : t('hearthisEmbedImportStates.copyThisTracksAudioFrom')}
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
        {state === 'busy'
          ? t('hearthisEmbedImportStates.starting')
          : t('hearthisEmbedImportStates.importAudio')}
      </Button>
    </div>
  );
}
