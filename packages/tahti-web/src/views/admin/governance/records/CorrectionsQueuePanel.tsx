import { useCallback, useEffect, useState } from 'react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
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
import { relativeDate } from '../../../../lib/relativeDate';
import { AnswerCorrectionForm } from './AnswerCorrectionForm';

const SUBJECT_FOR_BOARD = {
  MEMBER_REGISTER: 'Member register details',
  GOVERNANCE_RECORD: CORRECTION_SUBJECT_LABELS.GOVERNANCE_RECORD,
} as const;

function stateLabels(t: TFunction<'web'>) {
  return {
    OPEN: { label: t('correctionsQueuePanelMore.waiting'), color: 'yellow' },
    ACCEPTED: {
      label: t('correctionsQueuePanelMore.accepted'),
      color: 'green',
    },
    REJECTED: { label: t('correctionsQueuePanelMore.rejected'), color: 'red' },
    WITHDRAWN: {
      label: t('correctionsQueuePanelMore.withdrawn'),
      color: 'secondary',
    },
  } as const;
}

type Filter = 'waiting' | 'all';

/** Members' correction requests, the longest-waiting first. */
export function CorrectionsQueuePanel() {
  const { t } = useTranslation('web');
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
    <StudioPanel title={t('correctionsQueuePanel.correctionRequests')}>
      <SegmentedControl
        aria-label={t('correctionsQueuePanel.whichRequests')}
        value={filter}
        onChange={setFilter}
        options={[
          { id: 'waiting', label: t('correctionsQueuePanelFields.waiting') },
          { id: 'all', label: 'All' },
        ]}
      />
      {rows === null ? (
        <PageLoading label={t('loading.loadingRequests')} />
      ) : loadError && rows.length === 0 ? (
        <PageError
          title={t('loadErrors.couldNotLoadCorrectionRequests')}
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
            const state = stateLabels(t)[row.state];
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
                  · sent {relativeDate(row.createdAt)}
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
