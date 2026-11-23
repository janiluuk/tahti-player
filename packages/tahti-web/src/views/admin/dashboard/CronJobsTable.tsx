import { TimerIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  Tooltip,
} from '@tahti-player/ui';

import { formatRunDuration, type AdminCronRow } from '../../../api/admin';
import { StudioPanel } from '../../../components/StudioPanel';
import { humanizePastDate } from '../../../lib/humanizeDate';
import { dateLocaleTag } from '../../../lib/locale';
import { cronOutcomeColor, cronOutcomeLabel } from '../status/cronOutcome';

const CELL = 'px-2 py-1.5 align-middle whitespace-nowrap first:pl-0 last:pr-0';

/** `every 60000ms` (interval jobs) → `1 min`; anything else is a cron
 * expression and is shown as written. */
export function cronIntervalLabel(pattern: string): string | null {
  const match = /^every (\d+)ms$/.exec(pattern);
  if (!match) {
    return null;
  }
  const ms = Number(match[1]);
  if (ms % 3_600_000 === 0) {
    return `${ms / 3_600_000} h`;
  }
  if (ms % 60_000 === 0) {
    return `${ms / 60_000} min`;
  }
  return `${Math.round(ms / 1000)} s`;
}

function ScheduleCell({ pattern }: { pattern?: string }) {
  const { t } = useTranslation('web');
  if (!pattern) {
    return <>-</>;
  }
  const interval = cronIntervalLabel(pattern);
  return interval ? (
    <>{t('adminDashboard.cronEvery', { interval })}</>
  ) : (
    <code className="font-mono text-[11px]">{pattern}</code>
  );
}

export function CronJobsTable({
  jobs,
  onOpen,
}: {
  jobs: AdminCronRow[];
  onOpen: (jobName: string) => void;
}) {
  const { t } = useTranslation('web');
  return (
    <StudioPanel
      id="cron-jobs"
      title={t('adminDashboard.cronJobs')}
      icon={TimerIcon}
      compact
      className="scroll-mt-20"
    >
      {jobs.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          {t('adminDashboard.cronJobsEmpty')}
        </p>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <DataTable className="text-xs sm:text-sm">
            <DataTableHead>
              <DataTableRow>
                <DataTableHeaderCell className={CELL}>
                  {t('adminDashboard.cronColJob')}
                </DataTableHeaderCell>
                <DataTableHeaderCell className={CELL}>
                  {t('adminDashboard.cronColStatus')}
                </DataTableHeaderCell>
                <DataTableHeaderCell className={CELL}>
                  {t('adminDashboard.cronColLastRun')}
                </DataTableHeaderCell>
                <DataTableHeaderCell
                  className={`${CELL} hidden text-right sm:table-cell`}
                >
                  {t('adminDashboard.cronColDuration')}
                </DataTableHeaderCell>
                <DataTableHeaderCell className={`${CELL} hidden md:table-cell`}>
                  {t('adminDashboard.cronColSchedule')}
                </DataTableHeaderCell>
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {jobs.map((job) => {
                const run = job.lastRun;
                const startedLabel = run
                  ? new Date(run.startedAt).toLocaleString(dateLocaleTag())
                  : null;
                return (
                  <DataTableRow
                    key={job.jobName}
                    data-testid="cron-job-row"
                    className="hover:bg-background-secondary/60 cursor-pointer"
                    onClick={() => onOpen(job.jobName)}
                  >
                    <DataTableCell className={`${CELL} w-full max-w-56`}>
                      <Tooltip
                        content={job.description}
                        side="right"
                        wrapperClassName="inline-flex max-w-full"
                        multiline
                      >
                        <Button
                          aria-description={job.description}
                          size="flexible"
                          variant="text"
                          className="block max-w-full truncate p-0 text-left text-inherit underline-offset-2 hover:underline"
                          aria-label={t('cronOutcome.runHistory', {
                            job: job.jobName,
                          })}
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpen(job.jobName);
                          }}
                        >
                          {job.jobName}
                        </Button>
                      </Tooltip>
                    </DataTableCell>
                    <DataTableCell className={CELL}>
                      {run ? (
                        <Tooltip
                          content={run.errorMessage ?? ''}
                          side="top"
                          wrapperClassName="inline-flex"
                          multiline
                          disabled={!run.errorMessage}
                        >
                          <Badge
                            variant="pill"
                            color={cronOutcomeColor(run.outcome)}
                          >
                            {cronOutcomeLabel(run.outcome)}
                          </Badge>
                        </Tooltip>
                      ) : (
                        <span className="text-foreground-secondary">
                          {t('adminDashboard.cronNeverRun')}
                        </span>
                      )}
                    </DataTableCell>
                    <DataTableCell
                      className={`${CELL} text-foreground-secondary`}
                    >
                      {run && startedLabel ? (
                        <time
                          dateTime={run.startedAt}
                          title={startedLabel}
                          aria-description={startedLabel}
                        >
                          {humanizePastDate(run.startedAt)}
                        </time>
                      ) : (
                        '-'
                      )}
                    </DataTableCell>
                    <DataTableCell
                      className={`${CELL} text-foreground-secondary hidden text-right tabular-nums sm:table-cell`}
                    >
                      {run?.durationMs != null
                        ? formatRunDuration(run.durationMs)
                        : '-'}
                    </DataTableCell>
                    <DataTableCell
                      className={`${CELL} text-foreground-secondary hidden md:table-cell`}
                    >
                      <ScheduleCell pattern={job.pattern} />
                    </DataTableCell>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTable>
        </div>
      )}
    </StudioPanel>
  );
}
