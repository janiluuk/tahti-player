import { toast } from 'sonner';

import type { SoundProcessingStatus } from '../../api/studio';
import type { ProcessingJob } from '../../stores/processingJobsStore';

/**
 * Toasts each watched upload that just failed. Only jobs still in `watched`
 * count, so a poll that resolves after another one already settled the id
 * does not toast it twice.
 */
export function toastProcessingFailures(
  settled: SoundProcessingStatus['settled'],
  watched: readonly ProcessingJob[],
  openSound: (id: string) => void,
): void {
  for (const item of settled) {
    if (item.status !== 'ERROR') {
      continue;
    }
    const job = watched.find((candidate) => candidate.id === item.id);
    if (!job) {
      continue;
    }
    toast.error(
      item.processingError
        ? `Processing failed: ${item.processingError}`
        : 'Processing failed',
      {
        description: job.title,
        action: { label: 'View sound', onClick: () => openSound(item.id) },
      },
    );
  }
}
