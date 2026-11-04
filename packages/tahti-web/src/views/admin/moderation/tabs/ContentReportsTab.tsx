import {
  CheckCircle2Icon,
  Clock3Icon,
  ExternalLinkIcon,
  ListFilterIcon,
  Trash2Icon,
  XCircleIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  ButtonAnchor,
  InlineError,
  Input,
  Select,
} from '@tahti-player/ui';

import {
  fetchAdminContentReports,
  resolveContentReport,
  type AdminContentReportRow,
  type AdminContentReportStatus,
} from '../../../../api/admin';
import { deleteComment } from '../../../../api/comments';
import { ListingDate } from '../../../../components/ListingDate';
import { PageEmpty, PageLoading } from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';
import { ModerationTabs } from '../ModerationTabs';

const FILTER_DEFS: {
  id: AdminContentReportStatus | 'all';
  labelKey:
    | 'adminContentReports.filterAll'
    | 'adminContentReports.filterOpen'
    | 'adminContentReports.filterReviewing'
    | 'adminContentReports.filterActioned'
    | 'adminContentReports.filterDismissed';
}[] = [
  { id: 'all', labelKey: 'adminContentReports.filterAll' },
  { id: 'OPEN', labelKey: 'adminContentReports.filterOpen' },
  { id: 'REVIEWING', labelKey: 'adminContentReports.filterReviewing' },
  { id: 'ACTIONED', labelKey: 'adminContentReports.filterActioned' },
  { id: 'DISMISSED', labelKey: 'adminContentReports.filterDismissed' },
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
  const { t } = useTranslation('web');
  if (report.targetLabel === undefined) {
    return null;
  }
  if (!report.targetLabel || !report.targetUrl) {
    return (
      <p className="text-foreground-secondary text-xs">
        {t('adminContentReports.itemRemoved')}
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
        className="text-primary-strong h-auto gap-1.5 p-0"
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
  const { t } = useTranslation('web');
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (report.status === 'ACTIONED' || report.status === 'DISMISSED') {
    return (
      <div className="text-foreground-secondary text-xs">
        {report.status === 'ACTIONED'
          ? t('adminContentReports.statusActioned')
          : t('adminContentReports.statusDismissed')}
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
    setError(null);
    void resolveContentReport(report.id, status, note.trim() || undefined).then(
      (result) => {
        setPending(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
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
        note.trim() || t('adminContentReports.defaultNote'),
      ).then((resolved) => {
        setPending(false);
        setConfirmingDelete(false);
        if (!resolved.ok) {
          setError(
            `The comment is deleted, but the report is still open: ${resolved.error}`,
          );
          return;
        }
        onDone();
      });
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Input
        aria-label={t('adminContentReports.resolutionNoteAria')}
        placeholder={t('adminContentReports.resolutionNotePlaceholder')}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="h-7 max-w-xs text-xs"
      />
      <div className="flex flex-wrap gap-1.5">
        {report.status === 'OPEN' && (
          <Button
            className="gap-1.5"
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
          className="gap-1.5"
          size="sm"
          disabled={pending}
          onClick={() => resolve('ACTIONED')}
        >
          <CheckCircle2Icon size={14} aria-hidden />
          Mark actioned
        </Button>
        <Button
          className="gap-1.5"
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
            className="gap-1.5"
            size="sm"
            variant="secondary"
            intent="danger"
            disabled={pending}
            onClick={removeComment}
          >
            <Trash2Icon size={14} aria-hidden />
            {confirmingDelete
              ? t('adminContentReports.confirmDelete')
              : t('adminContentReports.deleteComment')}
          </Button>
        ) : null}
      </div>
      {confirmingDelete ? (
        <p className="text-foreground-secondary text-xs">
          The commenter is notified that the board removed their comment.
        </p>
      ) : null}
      {error ? <InlineError textSize="xs">{error}</InlineError> : null}
    </div>
  );
}

type TargetFilter = AdminContentReportRow['targetType'] | 'all';

const TARGET_DEFS: {
  id: TargetFilter;
  labelKey:
    | 'adminContentReports.typeEverything'
    | 'adminContentReports.typeTracks'
    | 'adminContentReports.typeReleases'
    | 'adminContentReports.typeChannels'
    | 'adminContentReports.typeCollections'
    | 'adminContentReports.typeComments'
    | 'adminContentReports.typeMotionComments'
    | 'adminContentReports.typeDiscussionReplies';
}[] = [
  { id: 'all', labelKey: 'adminContentReports.typeEverything' },
  { id: 'SOUND_ITEM', labelKey: 'adminContentReports.typeTracks' },
  { id: 'RELEASE', labelKey: 'adminContentReports.typeReleases' },
  { id: 'CHANNEL', labelKey: 'adminContentReports.typeChannels' },
  { id: 'COLLECTION', labelKey: 'adminContentReports.typeCollections' },
  { id: 'COMMENT', labelKey: 'adminContentReports.typeComments' },
  { id: 'MOTION_COMMENT', labelKey: 'adminContentReports.typeMotionComments' },
  {
    id: 'DISCUSSION_POST',
    labelKey: 'adminContentReports.typeDiscussionReplies',
  },
];

/** Content reports tab — ported as-is from the standalone admin route (see
 * AdminModerationView). Anonymous reports of channels, releases, archive
 * items, and collections — reporting needs no account. */
export function ContentReportsTab() {
  const { t } = useTranslation('web');
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
        items={FILTER_DEFS.map((item) => ({
          id: item.id,
          label: t(item.labelKey),
          icon: FILTER_TAB_ICONS[item.id],
        }))}
        ariaLabel={t('adminContentReports.statusAria')}
        onChange={(id) => setFilter(id as AdminContentReportStatus | 'all')}
      />

      <Select
        label={t('adminContentReports.reported')}
        value={target}
        onValueChange={(value) => setTarget(value as TargetFilter)}
        options={TARGET_DEFS.map((item) => ({
          id: item.id,
          label: t(item.labelKey),
        }))}
        className="max-w-xs"
      />

      <StudioPanel>
        {loading ? (
          <PageLoading label={t('adminContentReports.loading')} />
        ) : reports.length === 0 ? (
          <PageEmpty title={t('adminContentReports.empty')} />
        ) : (
          <ul className="divide-border divide-y">
            {reports.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1 basis-64">
                  <div className="font-medium">
                    {r.reason.replace(/_/g, ' ')} ·{' '}
                    <span className="text-foreground-secondary font-normal">
                      {r.targetType.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>
                  <ReportTarget report={r} />
                  <div className="text-foreground-secondary text-xs">
                    {r.details ?? t('adminContentReports.noDetails')} ·{' '}
                    <ListingDate value={r.createdAt} />
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
