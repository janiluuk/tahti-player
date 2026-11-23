import { LayersIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge } from '@tahti-player/ui';

import type { AdminQueueRow } from '../../../api/admin';
import { StudioPanel } from '../../../components/StudioPanel';

export function QueueHealthStrip({ queues }: { queues: AdminQueueRow[] }) {
  const { t } = useTranslation('web');
  const title = t('adminDashboard.queueHealth');
  return (
    <StudioPanel
      id="queue-health"
      title={title}
      icon={LayersIcon}
      compact
      className="scroll-mt-20"
    >
      {queues.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          {t('adminDashboard.queuesEmpty')}
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2" aria-label={title}>
          {queues.map((queue) => (
            <li
              key={queue.name}
              data-failed={queue.failed > 0 || undefined}
              className={`bg-background flex max-w-full min-w-0 items-center gap-2 rounded-md border px-2.5 py-1 text-xs ${
                queue.failed > 0 ? 'border-accent-red' : 'border-border'
              }`}
            >
              <span className="min-w-0 truncate font-medium">{queue.name}</span>
              <span className="text-foreground-secondary shrink-0 tabular-nums">
                {t('adminDashboard.queueWaiting', { waiting: queue.waiting })}
              </span>
              {queue.failed > 0 ? (
                <Badge variant="pill" color="red" className="shrink-0">
                  {t('adminDashboard.queueFailedCount', {
                    failed: queue.failed,
                  })}
                </Badge>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </StudioPanel>
  );
}
