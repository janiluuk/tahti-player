import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, FilterChips, InlineError } from '@tahti-player/ui';

import {
  fetchAdminQueueJobs,
  type AdminQueueJob,
  type AdminQueueJobState,
} from '../../../api/admin/admin-queue-jobs';
import { PageLoading } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';

const STATES: AdminQueueJobState[] = [
  'waiting',
  'active',
  'delayed',
  'failed',
  'completed',
];

function ageLabel(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) {
    return '—';
  }
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) {
    return '<1m';
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 48) {
    return `${hours}h`;
  }
  return `${Math.floor(hours / 24)}d`;
}

export function QueuesJobsPanel() {
  const { t } = useTranslation('web');
  const [state, setState] = useState<AdminQueueJobState>('waiting');
  const [jobs, setJobs] = useState<AdminQueueJob[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchAdminQueueJobs({ state, limit: 50 }).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.data) {
        setJobs(null);
        setError(result.meta.reason ?? t('adminQueues.loadError'));
        return;
      }
      setError(null);
      setJobs(result.data.jobs);
      setTotal(result.data.total);
    });
    return () => {
      cancelled = true;
    };
  }, [state, attempt, t]);

  return (
    <div data-testid="admin-queues-jobs">
      <StudioPanel title={t('adminQueues.title')}>
        <FilterChips
          aria-label={t('adminQueues.stateFilter')}
          items={STATES.map((id) => ({
            id,
            label: t(`adminQueues.states.${id}`),
          }))}
          selected={state}
          onChange={(next) => setState(next as AdminQueueJobState)}
        />
        {loading ? <PageLoading label={t('settingsBody.loading')} /> : null}
        {error ? (
          <div className="mt-3 flex flex-col gap-2">
            <InlineError>{error}</InlineError>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setAttempt((n) => n + 1)}
            >
              {t('actions.tryAgain')}
            </Button>
          </div>
        ) : null}
        {!loading && !error && jobs ? (
          <>
            <p className="text-foreground-secondary mt-3 text-xs">
              {t('adminQueues.showing', { shown: jobs.length, total })}
            </p>
            {jobs.length === 0 ? (
              <p className="text-foreground-secondary mt-2 text-sm">
                {t('adminQueues.empty')}
              </p>
            ) : (
              <ul
                className="divide-border mt-2 divide-y"
                data-testid="admin-queue-job-list"
              >
                {jobs.map((job) => (
                  <li
                    key={job.id}
                    className="flex flex-col gap-0.5 py-2 text-sm first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate font-medium">
                        {job.subject.title ?? job.name}
                      </span>
                      <span className="text-foreground-secondary shrink-0 text-xs">
                        {ageLabel(job.timestamp)}
                      </span>
                    </div>
                    <p className="text-foreground-secondary truncate text-xs">
                      {job.name}
                      {job.subject.ownerUsername
                        ? ` · ${job.subject.ownerUsername}`
                        : ''}
                      {job.attemptsMade > 0
                        ? ` · ${t('adminQueues.attempts', { count: job.attemptsMade })}`
                        : ''}
                    </p>
                    {job.failedReason ? (
                      <p className="text-destructive truncate text-xs">
                        {job.failedReason}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
      </StudioPanel>
    </div>
  );
}
