import { toast } from 'sonner';

import { i18n } from '@tahti-player/i18n';

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
        ? i18n.t('web:toasts.processingFailedReason', {
            reason: item.processingError,
          })
        : i18n.t('web:toasts.processingFailed'),
      {
        description: job.title,
        action: {
          label: i18n.t('web:toasts.viewSound'),
          onClick: () => openSound(item.id),
        },
      },
    );
  }
}
