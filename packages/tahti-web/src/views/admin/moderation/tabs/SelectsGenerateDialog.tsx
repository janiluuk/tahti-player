import { useEffect, useState } from 'react';

import { Button, Dialog, SegmentedControl } from '@tahti-player/ui';

import {
  generateSelectsRotation,
  type SelectsGenerateMode,
} from '../../../../api/admin';

export function SelectsGenerateDialog({
  isOpen,
  rotationSize,
  onClose,
  onGenerated,
}: {
  isOpen: boolean;
  rotationSize: number;
  onClose: () => void;
  onGenerated: (message: string) => void;
}) {
  const [mode, setMode] = useState<SelectsGenerateMode>('add');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode('add');
      setError(null);
    }
  }, [isOpen]);

  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose} className="max-w-md">
      <Dialog.Title>Fill from the top list</Dialog.Title>
      <Dialog.Description>
        Picks the 10 most-played public tracks that aren't in the rotation yet,
        topped up with the newest uploads if there aren't enough.
      </Dialog.Description>
      <SegmentedControl<SelectsGenerateMode>
        aria-label="How to fill the rotation"
        value={mode}
        onChange={setMode}
        options={[
          { id: 'add', label: 'Add to the end' },
          { id: 'replace', label: 'Replace the rotation' },
        ]}
      />
      {mode === 'replace' && rotationSize > 0 ? (
        <p className="text-accent-red-strong mt-3 text-sm">
          This removes all {rotationSize} tracks in the current rotation.
        </p>
      ) : null}
      {error ? (
        <p className="text-accent-red-strong mt-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Dialog.Actions>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={pending}
          onClick={() => {
            setPending(true);
            setError(null);
            void generateSelectsRotation(mode).then((result) => {
              setPending(false);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              onGenerated(
                result.added === 0
                  ? 'No new tracks to add: every playable top track is already in the rotation.'
                  : `${mode === 'replace' ? 'Replaced the rotation with' : 'Added'} ${result.added} ${result.added === 1 ? 'track' : 'tracks'} from the top list.`,
              );
            });
          }}
        >
          {pending
            ? 'Filling…'
            : mode === 'replace'
              ? 'Replace rotation'
              : 'Add tracks'}
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
