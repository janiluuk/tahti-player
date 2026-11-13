import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, FilterChips, InlineError } from '@tahti-player/ui';

import {
  fetchAdminQueueJobs,
  fetchAdminQueuePaused,
  pauseAdminMediaQueue,
  removeAdminQueueJob,
  resumeAdminMediaQueue,
  retryAdminQueueJob,
  type AdminQueueJob,
  type AdminQueueJobState,
} from '../../../api/admin/admin-queue-jobs';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { PageLoading } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { StuckPendingPanel } from './StuckPendingPanel';

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
  const [paused, setPaused] = useState<boolean | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removeJob, setRemoveJob] = useState<AdminQueueJob | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.all([
      fetchAdminQueueJobs({ state, limit: 50 }),
      fetchAdminQueuePaused(),
    ]).then(([jobsResult, pausedResult]) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (pausedResult.data) {
        setPaused(pausedResult.data.paused);
      }
      if (!jobsResult.data) {
        setJobs(null);
        setError(jobsResult.meta.reason ?? t('adminQueues.loadError'));
        return;
      }
      setError(null);
      setJobs(jobsResult.data.jobs);
      setTotal(jobsResult.data.total);
    });
    return () => {
      cancelled = true;
    };
  }, [state, attempt, t]);

  const refresh = () => setAttempt((n) => n + 1);

  const onPauseToggle = async () => {
    setActionError(null);
    const result =
      paused === true
        ? await resumeAdminMediaQueue()
        : await pauseAdminMediaQueue();
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    setPaused(result.paused);
  };

  const onRetry = async (job: AdminQueueJob) => {
    setActionError(null);
    setBusyId(job.id);
    const result = await retryAdminQueueJob(job.id);
    setBusyId(null);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    refresh();
  };

  const onConfirmRemove = async () => {
    if (!removeJob) {
      return;
    }
    setActionError(null);
    setBusyId(removeJob.id);
    const result = await removeAdminQueueJob(removeJob.id);
    setBusyId(null);
    setRemoveJob(null);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    refresh();
  };

  return (
    <div className="flex flex-col gap-6" data-testid="admin-queues-jobs">
      <StudioPanel title={t('adminQueues.title')}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void onPauseToggle()}
          >
            {paused
              ? t('adminQueues.resumeQueue')
              : t('adminQueues.pauseQueue')}
          </Button>
          {paused ? (
            <span className="text-foreground-secondary text-xs">
              {t('adminQueues.pausedHint')}
            </span>
          ) : null}
        </div>
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
            <Button size="sm" variant="secondary" onClick={refresh}>
              {t('actions.tryAgain')}
            </Button>
          </div>
        ) : null}
        {actionError ? (
          <InlineError className="mt-2">{actionError}</InlineError>
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
                    className="flex flex-col gap-1 py-2 text-sm first:pt-0 last:pb-0"
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
                    <div className="flex flex-wrap gap-2">
                      {job.state === 'failed' ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyId === job.id}
                          onClick={() => void onRetry(job)}
                        >
                          {t('adminQueues.retry')}
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="text"
                        className="text-destructive"
                        disabled={busyId === job.id}
                        onClick={() => setRemoveJob(job)}
                      >
                        {t('adminQueues.remove')}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
      </StudioPanel>

      <StuckPendingPanel />

      <ConfirmDialog
        destructive
        isOpen={removeJob !== null}
        title={t('adminQueues.removeTitle')}
        description={t('adminQueues.removeDescription')}
        confirmLabel={t('adminQueues.remove')}
        onCancel={() => setRemoveJob(null)}
        onConfirm={() => void onConfirmRemove()}
      />
    </div>
  );
}
