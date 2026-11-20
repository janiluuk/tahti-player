import { RotateCcwIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Alert, Button } from '@tahti-player/ui';

import type { StudioSound } from '../../../api/studio-types';
import {
  canRetrySoundProcessing,
  useRetrySoundProcessing,
} from '../../../hooks/useRetrySoundProcessing';

export function ProcessingFailedAlert({
  item,
  onRetried,
}: {
  item: StudioSound;
  onRetried: () => void;
}) {
  const { t } = useTranslation('web');
  const { retry, retryingId } = useRetrySoundProcessing(onRetried);
  const retryable = canRetrySoundProcessing(item);

  return (
    <Alert tone="error">
      <p>
        {item.processingError
          ? t('processingFailedAlertBatch32.failedWithReason', {
              reason: item.processingError,
            })
          : t('processingFailedAlertBatch32.failedForFile')}
      </p>
      <p>
        {retryable
          ? t('processingFailedAlertStates.tryProcessingItAgainIf')
          : t('processingFailedAlertStates.tryUploadingItAgainOr')}
      </p>
      {retryable ? (
        <Button
          size="xs"
          variant="secondary"
          className="mt-2"
          disabled={retryingId === item.id}
          onClick={() => void retry(item)}
        >
          <RotateCcwIcon size={14} aria-hidden className="mr-1" />
          {t('processingFailedAlert.retryProcessing')}
        </Button>
      ) : null}
    </Alert>
  );
}
