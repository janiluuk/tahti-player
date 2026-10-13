import { useState } from 'react';

import { loadBlobOntoNewTrack } from '@tahti-player/audio-editor';
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
  const [open, setOpen] = useState(false);
  return (
    <StudioPanel
      title="Metamorph between takes"
      description="Same song, new skin: keep one version's timing and bleed in the sound of another."
      action={
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          Morph versions
        </Button>
      }
    >
      <p className="text-foreground-secondary text-sm">
        The morph renders in this browser and lands on its own lane, named after
        the two versions it came from. Bounce to publish it as a revision.
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
