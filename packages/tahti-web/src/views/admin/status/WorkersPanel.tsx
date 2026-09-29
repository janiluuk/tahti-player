import { HistoryIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Badge, Button, Dialog } from '@tahti-player/ui';

import {
  fetchAdminWorkerHistory,
  fetchAdminWorkers,
  type AdminWorker,
  type AdminWorkerJobEvent,
} from '../../../api/admin';
import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { humanizePastDate } from '../../../lib/humanizeDate';

const EVENT_COLORS: Record<
  AdminWorkerJobEvent['status'],
  'green' | 'red' | 'cyan'
> = {
  completed: 'green',
  failed: 'red',
  active: 'cyan',
};

function WorkerHistoryDialog({
  worker,
  onClose,
}: {
  worker: AdminWorker | null;
  onClose: () => void;
}) {
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
        <p className="text-accent-red-strong text-sm" role="alert">
          {error}
        </p>
      ) : history === null ? (
        <PageLoading label="Loading history…" />
      ) : history.length === 0 ? (
        <PageEmpty title="No jobs recorded yet" />
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
                {new Date(event.at).toLocaleString()}
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
        <Dialog.Close>Close</Dialog.Close>
      </Dialog.Actions>
    </Dialog.Root>
  );
}

export function WorkersPanel() {
  const [workers, setWorkers] = useState<AdminWorker[] | null>(null);
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
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const offline = workers?.filter((worker) => worker.status === 'offline');

  return (
    <StudioPanel
      title="Workers"
      description={
        offline && offline.length > 0
          ? `${offline.length} of ${workers?.length} offline (no heartbeat recently).`
          : 'Background job workers and what they ran last.'
      }
    >
      {error ? (
        <PageError
          title="Couldn't load workers"
          description={error}
          onRetry={() => void load()}
        />
      ) : workers === null ? (
        <PageLoading label="Loading workers…" />
      ) : workers.length === 0 ? (
        <PageEmpty title="No workers have reported in" />
      ) : (
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
                    {worker.status === 'online' ? 'Online' : 'Offline'}
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
                History
              </Button>
            </li>
          ))}
        </ul>
      )}
      <WorkerHistoryDialog
        worker={historyFor}
        onClose={() => setHistoryFor(null)}
      />
    </StudioPanel>
  );
}
