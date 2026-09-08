import {
  BanIcon,
  CheckCircle2Icon,
  Clock3Icon,
  CopyIcon,
  FileTextIcon,
  ListFilterIcon,
  LoaderCircleIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge, Button } from '@tahti-player/ui';

import {
  fetchAdminFeatureRequestReports,
  fetchAdminFeatureRequests,
  generateFeatureRequestQuarterlyReport,
  updateFeatureRequestStatus,
  type AdminFeatureRequestRow,
  type AdminFeatureRequestStatus,
} from '../../../../api/admin';
import type { GovernanceQuarterlyReport } from '../../../../api/types';
import { PageLoading } from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';
import { ModerationTabs } from '../ModerationTabs';

function currentQuarterLabel(): string {
  const now = new Date();
  const quarter = Math.floor(now.getUTCMonth() / 3) + 1;
  return `Q${quarter} ${now.getUTCFullYear()}`;
}

function QuarterlyReportsPanel() {
  const [reports, setReports] = useState<GovernanceQuarterlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    void fetchAdminFeatureRequestReports().then((res) => {
      setReports(res.data);
      setLoading(false);
    });
  };

  useEffect(reload, []);

  return (
    <StudioPanel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-sm font-bold">
          Quarterly review reports
        </h3>
        <Button
          size="sm"
          variant="secondary"
          disabled={generating}
          onClick={() => {
            setGenerating(true);
            setError(null);
            void generateFeatureRequestQuarterlyReport().then((result) => {
              setGenerating(false);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              reload();
            });
          }}
        >
          <FileTextIcon size={14} aria-hidden />
          {generating
            ? 'Generating…'
            : `Generate ${currentQuarterLabel()} report`}
        </Button>
      </div>
      {error && <p className="text-accent-red mt-2 text-xs">{error}</p>}
      {loading ? (
        <PageLoading label="Loading reports…" />
      ) : reports.length === 0 ? (
        <p className="text-foreground-secondary mt-2 text-sm">
          No quarterly reports generated yet.
        </p>
      ) : (
        <ul className="divide-border mt-2 divide-y">
          {reports.map((report) => (
            <li
              key={report.id}
              className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0"
            >
              <div>
                {report.downloadUrl ? (
                  <a
                    href={report.downloadUrl}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    Q{report.quarter} {report.year}
                  </a>
                ) : (
                  <span className="font-medium">
                    Q{report.quarter} {report.year}
                  </span>
                )}
                <span className="text-foreground-secondary ml-2 text-xs">
                  by {report.generatedByDisplayName}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </StudioPanel>
  );
}

const FILTERS: { id: AdminFeatureRequestStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'OPEN', label: 'Open' },
  { id: 'PLANNED', label: 'Planned' },
  { id: 'IN_PROGRESS', label: 'In progress' },
  { id: 'DONE', label: 'Done' },
  { id: 'DECLINED', label: 'Declined' },
];

const FILTER_TAB_ICONS = {
  all: ListFilterIcon,
  OPEN: Clock3Icon,
  PLANNED: Clock3Icon,
  IN_PROGRESS: LoaderCircleIcon,
  DONE: CheckCircle2Icon,
  DECLINED: BanIcon,
  DUPLICATE: CopyIcon,
};

function statusBadge(status: AdminFeatureRequestStatus): {
  label: string;
  color: 'orange' | 'cyan' | 'green' | 'secondary';
} {
  switch (status) {
    case 'OPEN':
      return { label: 'Open', color: 'orange' };
    case 'PLANNED':
      return { label: 'Planned', color: 'cyan' };
    case 'IN_PROGRESS':
      return { label: 'In progress', color: 'cyan' };
    case 'DONE':
      return { label: 'Done', color: 'green' };
    default:
      return { label: 'Declined', color: 'secondary' };
  }
}

function RowActions({
  row,
  onDone,
}: {
  row: AdminFeatureRequestRow;
  onDone: () => void;
}) {
  const [pending, setPending] = useState(false);
  const terminal = row.status === 'DONE' || row.status === 'DECLINED';

  const apply = (status: AdminFeatureRequestStatus) => {
    setPending(true);
    void updateFeatureRequestStatus(row.id, status).then(() => {
      setPending(false);
      onDone();
    });
  };

  if (terminal) {
    return (
      <Button
        size="sm"
        variant="text"
        disabled={pending}
        onClick={() => apply('OPEN')}
      >
        <Clock3Icon size={14} aria-hidden />
        Reopen
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() => apply('PLANNED')}
      >
        <Clock3Icon size={14} aria-hidden />
        Plan
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() => apply('IN_PROGRESS')}
      >
        <LoaderCircleIcon size={14} aria-hidden />
        In progress
      </Button>
      <Button size="sm" disabled={pending} onClick={() => apply('DONE')}>
        <CheckCircle2Icon size={14} aria-hidden />
        Done
      </Button>
      <Button
        size="sm"
        variant="text"
        disabled={pending}
        onClick={() => apply('DECLINED')}
      >
        <BanIcon size={14} aria-hidden />
        Decline
      </Button>
    </div>
  );
}

/** Feature requests tab — ported as-is from the standalone admin route (see
 * AdminModerationView). Member-suggested features, ranked by votes. */
export function FeatureRequestsTab() {
  const [filter, setFilter] = useState<AdminFeatureRequestStatus | 'all'>(
    'OPEN',
  );
  const [rows, setRows] = useState<AdminFeatureRequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    void fetchAdminFeatureRequests(filter === 'all' ? undefined : filter).then(
      (res) => {
        setRows([...res.data].sort((a, b) => b.voteCount - a.voteCount));
        setLoading(false);
      },
    );
  };

  useEffect(reload, [filter]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-foreground-secondary text-sm">
        Member-suggested features, ranked by votes. Review quarterly.
      </p>

      <QuarterlyReportsPanel />

      <ModerationTabs
        activeId={filter}
        items={FILTERS.map((item) => ({
          ...item,
          icon: FILTER_TAB_ICONS[item.id],
        }))}
        ariaLabel="Feature request status"
        onChange={(id) => setFilter(id as AdminFeatureRequestStatus | 'all')}
      />

      <StudioPanel>
        {loading ? (
          <PageLoading label="Loading feature requests…" />
        ) : rows.length === 0 ? (
          <p className="text-foreground-secondary py-4 text-center text-sm">
            No feature requests in this view.
          </p>
        ) : (
          <ul className="divide-border divide-y">
            {rows.map((r) => {
              const badge = statusBadge(r.status);
              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      {r.title}
                      <Badge variant="pill" color={badge.color}>
                        {badge.label}
                      </Badge>
                    </div>
                    <div className="text-foreground-secondary text-xs">
                      {r.voteCount} votes · by @{r.proposerUsername}
                      {r.reviewNote ? ` · ${r.reviewNote}` : ''}
                    </div>
                  </div>
                  <RowActions row={r} onDone={reload} />
                </li>
              );
            })}
          </ul>
        )}
      </StudioPanel>
    </div>
  );
}
