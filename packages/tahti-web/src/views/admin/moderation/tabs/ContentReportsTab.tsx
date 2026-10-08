import {
  CheckCircle2Icon,
  Clock3Icon,
  ExternalLinkIcon,
  ListFilterIcon,
  Trash2Icon,
  XCircleIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, ButtonAnchor, Input, Select } from '@tahti-player/ui';

import {
  fetchAdminContentReports,
  resolveContentReport,
  type AdminContentReportRow,
  type AdminContentReportStatus,
} from '../../../../api/admin';
import { deleteComment } from '../../../../api/comments';
import { PageLoading } from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';
import { ModerationTabs } from '../ModerationTabs';

const FILTERS: { id: AdminContentReportStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'OPEN', label: 'Open' },
  { id: 'REVIEWING', label: 'Reviewing' },
  { id: 'ACTIONED', label: 'Actioned' },
  { id: 'DISMISSED', label: 'Dismissed' },
];

const FILTER_TAB_ICONS = {
  all: ListFilterIcon,
  OPEN: Clock3Icon,
  REVIEWING: Clock3Icon,
  ACTIONED: CheckCircle2Icon,
  DISMISSED: XCircleIcon,
};

/** What the report points at: a link to its page and, for a comment, the
 * text. Older API versions send none of these fields. */
function ReportTarget({ report }: { report: AdminContentReportRow }) {
  if (report.targetLabel === undefined) {
    return null;
  }
  if (!report.targetLabel || !report.targetUrl) {
    return (
      <p className="text-foreground-secondary text-xs">
        The reported item has been removed.
      </p>
    );
  }
  return (
    <div className="flex flex-col items-start gap-1">
      <ButtonAnchor
        href={report.targetUrl}
        target="_blank"
        rel="noreferrer"
        variant="text"
        size="sm"
        className="text-primary h-auto p-0"
      >
        <ExternalLinkIcon size={12} aria-hidden />
        {report.targetLabel}
      </ButtonAnchor>
      {report.targetExcerpt ? (
        <blockquote className="border-border text-foreground-secondary border-l-2 pl-2 text-xs">
          {report.targetExcerpt}
        </blockquote>
      ) : null}
    </div>
  );
}

function ReportActions({
  report,
  onDone,
}: {
  report: AdminContentReportRow;
  onDone: () => void;
}) {
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (report.status === 'ACTIONED' || report.status === 'DISMISSED') {
    return (
      <div className="text-foreground-secondary text-xs">
        {report.status === 'ACTIONED' ? 'Actioned' : 'Dismissed'}
        {report.resolvedByDisplayName
          ? ` by ${report.resolvedByDisplayName}`
          : ''}
        {report.resolutionNote && (
          <p className="mt-0.5">{report.resolutionNote}</p>
        )}
      </div>
    );
  }

  const resolve = (status: 'REVIEWING' | 'ACTIONED' | 'DISMISSED') => {
    setPending(true);
    void resolveContentReport(report.id, status, note.trim() || undefined).then(
      () => {
        setPending(false);
        onDone();
      },
    );
  };

  // A reported comment that still exists can be removed from here; the
  // report is then closed as actioned.
  const canDeleteComment =
    report.targetType === 'COMMENT' && Boolean(report.targetLabel);

  const removeComment = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setPending(true);
    setError(null);
    void deleteComment(report.targetId).then((result) => {
      if (!result.ok) {
        setPending(false);
        setConfirmingDelete(false);
        setError(result.error);
        return;
      }
      void resolveContentReport(
        report.id,
        'ACTIONED',
        note.trim() || 'Comment deleted',
      ).then(() => {
        setPending(false);
        onDone();
      });
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Input
        aria-label="Resolution note"
        placeholder="Resolution note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="h-7 max-w-xs text-xs"
      />
      <div className="flex flex-wrap gap-1.5">
        {report.status === 'OPEN' && (
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => resolve('REVIEWING')}
          >
            <Clock3Icon size={14} aria-hidden />
            Start review
          </Button>
        )}
        <Button
          size="sm"
          disabled={pending}
          onClick={() => resolve('ACTIONED')}
        >
          <CheckCircle2Icon size={14} aria-hidden />
          Mark actioned
        </Button>
        <Button
          size="sm"
          variant="text"
          disabled={pending}
          onClick={() => resolve('DISMISSED')}
        >
          <XCircleIcon size={14} aria-hidden />
          Dismiss
        </Button>
        {canDeleteComment ? (
          <Button
            size="sm"
            variant="secondary"
            intent="danger"
            disabled={pending}
            onClick={removeComment}
          >
            <Trash2Icon size={14} aria-hidden />
            {confirmingDelete ? 'Confirm delete' : 'Delete comment'}
          </Button>
        ) : null}
      </div>
      {error ? (
        <p className="text-accent-red-strong text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type TargetFilter = AdminContentReportRow['targetType'] | 'all';

const TARGET_OPTIONS: { id: TargetFilter; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'SOUND_ITEM', label: 'Tracks' },
  { id: 'RELEASE', label: 'Releases' },
  { id: 'CHANNEL', label: 'Channels' },
  { id: 'COLLECTION', label: 'Collections' },
  { id: 'COMMENT', label: 'Comments' },
  { id: 'MOTION_COMMENT', label: 'Motion comments' },
];

/** Content reports tab — ported as-is from the standalone admin route (see
 * AdminModerationView). Anonymous reports of channels, releases, archive
 * items, and collections — reporting needs no account. */
export function ContentReportsTab() {
  const [filter, setFilter] = useState<AdminContentReportStatus | 'all'>(
    'OPEN',
  );
  const [target, setTarget] = useState<TargetFilter>('all');
  const [reports, setReports] = useState<AdminContentReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    void fetchAdminContentReports(
      filter === 'all' ? undefined : filter,
      target === 'all' ? undefined : target,
    ).then((res) => {
      setReports(res.data);
      setLoading(false);
    });
  };

  useEffect(reload, [filter, target]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-foreground-secondary text-sm">
        Anonymous reports of channels, releases, tracks, collections and
        comments — reporting needs no account.
      </p>

      <ModerationTabs
        activeId={filter}
        items={FILTERS.map((item) => ({
          ...item,
          icon: FILTER_TAB_ICONS[item.id],
        }))}
        ariaLabel="Content report status"
        onChange={(id) => setFilter(id as AdminContentReportStatus | 'all')}
      />

      <Select
        label="Reported"
        value={target}
        onValueChange={(value) => setTarget(value as TargetFilter)}
        options={TARGET_OPTIONS}
        className="max-w-xs"
      />

      <StudioPanel>
        {loading ? (
          <PageLoading label="Loading content reports…" />
        ) : reports.length === 0 ? (
          <p className="text-foreground-secondary py-4 text-center text-sm">
            No reports in this view.
          </p>
        ) : (
          <ul className="divide-border divide-y">
            {reports.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {r.reason.replace(/_/g, ' ')} ·{' '}
                    <span className="text-foreground-secondary font-normal">
                      {r.targetType.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>
                  <ReportTarget report={r} />
                  <div className="text-foreground-secondary text-xs">
                    {r.details ?? 'No details provided'} ·{' '}
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <ReportActions report={r} onDone={reload} />
              </li>
            ))}
          </ul>
        )}
      </StudioPanel>
    </div>
  );
}
