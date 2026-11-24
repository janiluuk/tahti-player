import { ListVideoIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, FilterChips, InlineError, Toggle } from '@tahti-player/ui';

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
import { usePolling } from '../../../hooks/usePolling';
import { dateLocaleTag } from '../../../lib/locale';
import { StuckPendingPanel } from './StuckPendingPanel';

const LIVE_INTERVAL_MS = 5_000;

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
  const [live, setLive] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  const requestId = useRef(0);
  const load = useCallback(
    async (silent: boolean) => {
      const id = ++requestId.current;
      if (!silent) {
        setLoading(true);
      }
      const [jobsResult, pausedResult] = await Promise.all([
        fetchAdminQueueJobs({ state, limit: 50 }),
        fetchAdminQueuePaused(),
      ]);
      // A slower earlier poll must not overwrite a newer state's result.
      if (id !== requestId.current) {
        return;
      }
      setLoading(false);
      if (pausedResult.data) {
        setPaused(pausedResult.data.paused);
      }
      if (!jobsResult.data) {
        if (!silent) {
          setJobs(null);
        }
        setError(jobsResult.meta.reason ?? t('adminQueues.loadError'));
        return;
      }
      setError(null);
      setJobs(jobsResult.data.jobs);
      setTotal(jobsResult.data.total);
      setUpdatedAt(Date.now());
    },
    [state, t],
  );

  useEffect(() => {
    void load(false);
    return () => {
      requestId.current += 1;
    };
  }, [load, attempt]);

  usePolling(() => void load(true), LIVE_INTERVAL_MS, live);

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
    <div className="flex flex-col gap-4" data-testid="admin-queues-jobs">
      <StudioPanel title={t('adminQueues.title')} icon={ListVideoIcon} compact>
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
          <div className="ms-auto flex items-center gap-2">
            {updatedAt ? (
              <span
                className="text-foreground-secondary text-xs tabular-nums"
                data-testid="admin-queues-updated"
              >
                {t('adminQueues.updatedAt', {
                  time: new Date(updatedAt).toLocaleTimeString(dateLocaleTag()),
                })}
              </span>
            ) : null}
            <Toggle
              label={t('adminQueues.liveUpdates')}
              showLabel
              checked={live}
              onChange={setLive}
            />
          </div>
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
                      {job.state === 'active' && job.processedOn
                        ? ` · ${t('adminQueues.runningFor', { age: ageLabel(job.processedOn) })}`
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
