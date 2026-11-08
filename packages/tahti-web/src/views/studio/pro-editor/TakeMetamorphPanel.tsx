import { useState } from 'react';

import { loadBlobOntoNewTrack } from '@tahti-player/audio-editor';
import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import { StudioPanel } from '../../../components/StudioPanel';
import { TakeMetamorphDialog } from './TakeMetamorphDialog';

const METAMORPH_LANE_COLOR = '#d946ef';

/** Entry point for morphing two versions of the sound into a Multitrack clip. */
export function TakeMetamorphPanel({
  soundId,
  onAdded,
}: {
  soundId: string;
  /** Called with the new clip's provenance name once it is on the arrange. */
  onAdded?: (name: string) => void;
}) {
  const { t } = useTranslation('web');
  const [open, setOpen] = useState(false);
  return (
    <StudioPanel
      title={t('takeMetamorphPanel.metamorphBetweenTakes')}
      description={t('takeMetamorphPanel.sameSongNewSkinKeep')}
      action={
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          {t('takeMetamorphPanel.morphVersions')}
        </Button>
      }
    >
      <p className="text-foreground-secondary text-sm">
        {t('takeMetamorphPanel.theMorphRendersInThis')}
      </p>
      <TakeMetamorphDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        soundId={soundId}
        onAddClip={async (blob, name) => {
          await loadBlobOntoNewTrack(blob, name, METAMORPH_LANE_COLOR);
          onAdded?.(name);
        }}
      />
    </StudioPanel>
  );
}
