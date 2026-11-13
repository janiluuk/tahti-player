import { HistoryIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Alert, Badge, Button, Dialog, InlineError } from '@tahti-player/ui';

import {
  fetchAdminWorkerHistory,
  fetchAdminWorkers,
  type AdminWorker,
  type AdminWorkerJobEvent,
  type AdminWorkerLaneCoverage,
} from '../../../api/admin';
import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { humanizePastDate } from '../../../lib/humanizeDate';
import { dateLocaleTag } from '../../../lib/locale';

const EVENT_COLORS: Record<
  AdminWorkerJobEvent['status'],
  'green' | 'red' | 'cyan'
> = {
  completed: 'green',
  failed: 'red',
  active: 'cyan',
};

function emptyLanes(coverage: AdminWorkerLaneCoverage[]): string[] {
  return coverage
    .filter((row) => row.onlineWorkers === 0)
    .map((row) => row.lane)
    .sort();
}

function WorkerHistoryDialog({
  worker,
  onClose,
}: {
  worker: AdminWorker | null;
  onClose: () => void;
}) {
  const { t } = useTranslation('web');
  const [history, setHistory] = useState<AdminWorkerJobEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!worker) {
      return;
    }
    let cancelled = false;
    setHistory(null);
    setError(null);
    void fetchAdminWorkerHistory(worker.name).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setHistory(result.history);
    });
    return () => {
      cancelled = true;
    };
  }, [worker]);

  return (
    <Dialog.Root
      isOpen={worker !== null}
      onClose={onClose}
      className="max-w-lg"
    >
      <Dialog.Title>{worker?.name} job history</Dialog.Title>
      {error ? (
        <InlineError>{error}</InlineError>
      ) : history === null ? (
        <PageLoading label={t('loading.loadingHistory')} />
      ) : history.length === 0 ? (
        <PageEmpty title={t('empties.noJobsRecorded')} />
      ) : (
        <ul className="divide-border max-h-96 divide-y overflow-y-auto">
          {history.map((event) => (
            <li
              key={`${event.jobId}-${event.at}-${event.status}`}
              className="flex flex-col gap-1 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">
                  {event.jobName}{' '}
                  <span className="text-foreground-secondary font-normal">
                    #{event.jobId}
                  </span>
                </span>
                <Badge variant="pill" color={EVENT_COLORS[event.status]}>
                  {event.status}
                </Badge>
              </div>
              <time
                dateTime={event.at}
                className="text-foreground-secondary text-xs"
              >
                {new Date(event.at).toLocaleString(dateLocaleTag())}
              </time>
              {event.errorMessage ? (
                <code className="text-accent-red-strong text-xs break-words">
                  {event.errorMessage}
                </code>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <Dialog.Actions>
        <Dialog.Close>{t('workersPanel.close')}</Dialog.Close>
      </Dialog.Actions>
    </Dialog.Root>
  );
}

export function WorkersPanel() {
  const { t } = useTranslation('web');
  const [workers, setWorkers] = useState<AdminWorker[] | null>(null);
  const [laneCoverage, setLaneCoverage] = useState<AdminWorkerLaneCoverage[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [historyFor, setHistoryFor] = useState<AdminWorker | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const result = await fetchAdminWorkers();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setWorkers(result.workers);
    setLaneCoverage(result.laneCoverage);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const offline = workers?.filter((worker) => worker.status === 'offline');
  const uncovered = emptyLanes(laneCoverage);

  return (
    <StudioPanel
      title={t('workersPanel.workers')}
      description={
        offline && offline.length > 0
          ? `${offline.length} of ${workers?.length} offline (no heartbeat recently).`
          : 'Background job workers and what they ran last.'
      }
    >
      {error ? (
        <PageError
          title={t('loadErrors.couldnTLoadWorkers')}
          description={error}
          onRetry={() => void load()}
        />
      ) : workers === null ? (
        <PageLoading label={t('loading.loadingWorkers')} />
      ) : workers.length === 0 ? (
        <PageEmpty title={t('empties.noWorkersReported')} />
      ) : (
        <div className="flex flex-col gap-3">
          {uncovered.length > 0 ? (
            <Alert
              tone="warning"
              title={t('workersPanel.emptyLanesTitle')}
              data-testid="workers-empty-lanes"
            >
              {t('workersPanel.emptyLanesBody', {
                lanes: new Intl.ListFormat(dateLocaleTag(), {
                  type: 'conjunction',
                }).format(uncovered),
              })}
            </Alert>
          ) : null}
          <ul className="divide-border divide-y">
            {workers.map((worker) => (
              <li
                key={worker.name}
                className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    {worker.name}
                    <Badge
                      variant="pill"
                      color={worker.status === 'online' ? 'green' : 'red'}
                    >
                      {worker.status === 'online'
                        ? t('workersPanelStates.online')
                        : t('workersPanelStates.offline')}
                    </Badge>
                    {worker.lanes.map((lane) => (
                      <Badge key={lane} variant="pill" color="secondary">
                        {lane}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-foreground-secondary text-xs">
                    {[
                      worker.hostname,
                      worker.pid != null ? `pid ${worker.pid}` : null,
                      worker.updatedAt
                        ? `seen ${humanizePastDate(worker.updatedAt)}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                  {worker.lastJobName ? (
                    <div className="text-foreground-secondary text-xs">
                      Last job: {worker.lastJobName}
                      {worker.lastJobStatus ? ` (${worker.lastJobStatus})` : ''}
                      {worker.lastJobAt
                        ? ` · ${humanizePastDate(worker.lastJobAt)}`
                        : ''}
                    </div>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  variant="text"
                  onClick={() => setHistoryFor(worker)}
                >
                  <HistoryIcon size={14} aria-hidden className="mr-1.5" />
                  {t('workersPanel.history')}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <WorkerHistoryDialog
        worker={historyFor}
        onClose={() => setHistoryFor(null)}
      />
    </StudioPanel>
  );
}
