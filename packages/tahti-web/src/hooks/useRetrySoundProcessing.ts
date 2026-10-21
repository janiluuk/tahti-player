import { useState } from 'react';
import { toast } from 'sonner';

import { retrySoundProcessing } from '../api/studio';
import type { StudioSound } from '../api/studio-types';
import { useProcessingJobsStore } from '../stores/processingJobsStore';

/**
 * Retry is offered only for an uploaded file that failed, and only once the
 * API reports `processingError` (null or text) - an API without the field
 * has no retry route either.
 */
export function canRetrySoundProcessing(
  item: Pick<StudioSound, 'status' | 'processingError' | 'embedProvider'>,
): boolean {
  return (
    item.status === 'ERROR' &&
    item.processingError !== undefined &&
    !item.embedProvider
  );
}

/** Re-queues a failed sound and puts it back in the top bar's processing list. */
export function useRetrySoundProcessing(onRetried: (id: string) => void): {
  retry: (item: Pick<StudioSound, 'id' | 'title'>) => Promise<void>;
  retryingId: string | null;
} {
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const startJobs = useProcessingJobsStore((state) => state.start);

  const retry = async (item: Pick<StudioSound, 'id' | 'title'>) => {
    setRetryingId(item.id);
    try {
      const result = await retrySoundProcessing(item.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      startJobs([{ id: item.id, title: item.title, status: 'PENDING' }]);
      onRetried(item.id);
      toast.success(`Processing "${item.title}" again`);
    } finally {
      setRetryingId(null);
    }
  };

  return { retry, retryingId };
}
