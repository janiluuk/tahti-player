import { useCallback, useEffect, useState } from 'react';

import { Badge, SegmentedControl } from '@tahti-player/ui';

import {
  fetchAdminCorrections,
  type AdminGovernanceCorrection,
} from '../../../../api/admin/admin-governance-corrections';
import { CORRECTION_SUBJECT_LABELS } from '../../../../api/governance-corrections';
import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';
import { AnswerCorrectionForm } from './AnswerCorrectionForm';

const SUBJECT_FOR_BOARD = {
  MEMBER_REGISTER: 'Member register details',
  GOVERNANCE_RECORD: CORRECTION_SUBJECT_LABELS.GOVERNANCE_RECORD,
} as const;

const STATE_LABELS = {
  OPEN: { label: 'Waiting', color: 'yellow' },
  ACCEPTED: { label: 'Accepted', color: 'green' },
  REJECTED: { label: 'Rejected', color: 'red' },
  WITHDRAWN: { label: 'Withdrawn', color: 'secondary' },
} as const;

type Filter = 'waiting' | 'all';

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Members' correction requests, the longest-waiting first. */
export function CorrectionsQueuePanel() {
  const [filter, setFilter] = useState<Filter>('waiting');
  const [rows, setRows] = useState<AdminGovernanceCorrection[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await fetchAdminCorrections(
      filter === 'waiting' ? 'OPEN' : undefined,
    );
    setRows(result.data);
    setLoadError(
      result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
    );
  }, [filter]);

  useEffect(() => {
    setRows(null);
    void load();
  }, [load]);

  return (
    <StudioPanel title="Correction requests">
      <SegmentedControl
        aria-label="Which requests"
        value={filter}
        onChange={setFilter}
        options={[
          { id: 'waiting', label: 'Waiting' },
          { id: 'all', label: 'All' },
        ]}
      />
      {rows === null ? (
        <PageLoading label="Loading requests…" />
      ) : loadError && rows.length === 0 ? (
        <PageError
          title="Could not load correction requests"
          description={loadError}
          onRetry={() => {
            setRows(null);
            void load();
          }}
        />
      ) : rows.length === 0 ? (
        <PageEmpty
          title={
            filter === 'waiting'
              ? 'No requests are waiting'
              : 'No correction requests yet'
          }
        />
      ) : (
        <ul className="divide-border divide-y">
          {rows.map((row) => {
            const state = STATE_LABELS[row.state];
            return (
              <li
                key={row.id}
                className="flex flex-col gap-1 py-3 text-sm first:pt-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {SUBJECT_FOR_BOARD[row.subject]}
                  </span>
                  <Badge variant="pill" color={state.color}>
                    {state.label}
                  </Badge>
                </div>
                <p className="text-foreground-secondary text-xs">
                  {row.requester.displayName} @{row.requester.username}
                  {row.requester.memberNumber !== null
                    ? ` · member #${row.requester.memberNumber}`
                    : ''}{' '}
                  · sent {formatDay(row.createdAt)}
                  {row.recordKind
                    ? ` · ${row.recordKind.toLowerCase().replace('_', ' ')} ${row.recordId}`
                    : ''}
                </p>
                <p className="whitespace-pre-line">{row.details}</p>
                {row.resolutionNote ? (
                  <p className="text-foreground-secondary text-xs">
                    Answer: {row.resolutionNote}
                  </p>
                ) : null}
                {row.state === 'OPEN' ? (
                  <AnswerCorrectionForm
                    id={row.id}
                    onAnswered={() => void load()}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </StudioPanel>
  );
}
