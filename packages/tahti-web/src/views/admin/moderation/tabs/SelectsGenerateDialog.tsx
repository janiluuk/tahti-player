import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  InlineError,
  SegmentedControl,
} from '@tahti-player/ui';

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
  const { t } = useTranslation('web');
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
      <Dialog.Title>
        {t('selectsGenerateDialog.fillFromTheTopList')}
      </Dialog.Title>
      <Dialog.Description>
        {t('selectsGenerateDialog.picksThe10MostPlayed')}
      </Dialog.Description>
      <SegmentedControl<SelectsGenerateMode>
        aria-label={t('selectsGenerateDialog.howToFillTheRotation')}
        value={mode}
        onChange={setMode}
        options={[
          { id: 'add', label: t('selectsGenerateDialogMore.addToTheEnd') },
          {
            id: 'replace',
            label: t('selectsGenerateDialogMore.replaceTheRotation'),
          },
        ]}
      />
      {mode === 'replace' && rotationSize > 0 ? (
        <InlineError className="mt-3" announce={false}>
          This removes all {rotationSize} tracks in the current rotation.
        </InlineError>
      ) : null}
      {error ? <InlineError className="mt-3">{error}</InlineError> : null}
      <Dialog.Actions>
        <Button type="button" variant="secondary" onClick={onClose}>
          {t('selectsGenerateDialog.cancel')}
        </Button>
        <Button
          type="button"
          intent={mode === 'replace' ? 'danger' : undefined}
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
                  ? t('selectsGenerateDialogStates.noNewTracks')
                  : mode === 'replace'
                    ? t('selectsGenerateDialogStates.replacedRotation', {
                        count: result.added,
                      })
                    : t('selectsGenerateDialogStates.addedTracks', {
                        count: result.added,
                      }),
              );
            });
          }}
        >
          {pending
            ? 'Filling…'
            : mode === 'replace'
              ? t('selectsGenerateDialogStates.replaceRotation')
              : t('selectsGenerateDialogStates.addTracks')}
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
