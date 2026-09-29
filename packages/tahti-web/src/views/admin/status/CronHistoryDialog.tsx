import { useEffect, useState } from 'react';

import { Badge, Dialog } from '@tahti-player/ui';

import {
  fetchAdminCronHistory,
  formatRunDuration,
  type AdminCronRun,
} from '../../../api/admin';
import { PageEmpty, PageLoading } from '../../../components/PageStates';

function outcomeColor(outcome: string | null): 'green' | 'red' | 'cyan' {
  if (outcome === 'SUCCESS') {
    return 'green';
  }
  return outcome ? 'red' : 'cyan';
}

export function CronHistoryDialog({
  jobName,
  onClose,
}: {
  jobName: string | null;
  onClose: () => void;
}) {
  const [runs, setRuns] = useState<AdminCronRun[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobName) {
      return;
    }
    let cancelled = false;
    setRuns(null);
    setError(null);
    void fetchAdminCronHistory(jobName).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRuns(result.runs);
      setTotal(result.total);
    });
    return () => {
      cancelled = true;
    };
  }, [jobName]);

  const failures = runs?.filter(
    (run) => run.outcome && run.outcome !== 'SUCCESS',
  ).length;

  return (
    <Dialog.Root
      isOpen={jobName !== null}
      onClose={onClose}
      className="max-w-lg"
    >
      <Dialog.Title>{jobName} runs</Dialog.Title>
      {runs && runs.length > 0 ? (
        <Dialog.Description>
          {total > runs.length
            ? `The latest ${runs.length} of ${total} runs`
            : `${runs.length} ${runs.length === 1 ? 'run' : 'runs'}`}
          {failures ? `, ${failures} failed` : ''}.
        </Dialog.Description>
      ) : null}
      {error ? (
        <p className="text-accent-red-strong text-sm" role="alert">
          {error}
        </p>
      ) : runs === null ? (
        <PageLoading label="Loading runs…" />
      ) : runs.length === 0 ? (
        <PageEmpty title="This job hasn't run yet" />
      ) : (
        <ul className="divide-border max-h-96 divide-y overflow-y-auto">
          {runs.map((run) => (
            <li key={run.id} className="flex flex-col gap-1 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <time dateTime={run.startedAt}>
                  {new Date(run.startedAt).toLocaleString()}
                </time>
                <div className="flex items-center gap-2">
                  <span className="text-foreground-secondary text-xs">
                    {formatRunDuration(run.durationMs)}
                  </span>
                  <Badge variant="pill" color={outcomeColor(run.outcome)}>
                    {run.outcome ?? 'Running'}
                  </Badge>
                </div>
              </div>
              {run.errorMessage ? (
                <code className="text-accent-red-strong text-xs break-words">
                  {run.errorMessage}
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
