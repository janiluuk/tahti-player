import { RotateCcwIcon } from 'lucide-react';

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
  const { retry, retryingId } = useRetrySoundProcessing(onRetried);
  const retryable = canRetrySoundProcessing(item);

  return (
    <Alert tone="error">
      <p>
        Processing failed
        {item.processingError ? `: ${item.processingError}` : ' for this file.'}
      </p>
      <p>
        {retryable
          ? 'Try processing it again. If it keeps failing, upload the file again or contact support.'
          : 'Try uploading it again, or contact support if it keeps happening.'}
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
          Retry processing
        </Button>
      ) : null}
    </Alert>
  );
}
