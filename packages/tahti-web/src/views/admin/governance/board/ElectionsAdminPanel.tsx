import { PlusIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button, InlineError, Input, Select } from '@tahti-player/ui';

import {
  createAdminElection,
  fetchAdminElections,
  type AdminElection,
} from '../../../../api/admin/admin-governance-elections';
import {
  BOARD_ROLE_LABELS,
  type GovernanceBoardRole,
} from '../../../../api/governance-board';
import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';
import { numericDay } from '../../../../lib/relativeDate';
import { BOARD_ROLE_OPTIONS } from './AddBoardTermForm';
import { ElectionActions } from './ElectionActions';
import { ElectionCandidates } from './ElectionCandidates';

export function electionStage(election: AdminElection): {
  label: string;
  color: 'green' | 'secondary' | 'yellow' | 'red';
} {
  if (election.cancelledAt) {
    return { label: 'Cancelled', color: 'red' };
  }
  if (election.decidedAt) {
    return { label: 'Decided', color: 'secondary' };
  }
  if (
    election.nominationsCloseAt &&
    new Date(election.nominationsCloseAt) <= new Date()
  ) {
    return { label: 'Nominations closed', color: 'yellow' };
  }
  return { label: 'Nominations open', color: 'green' };
}

function NewElectionForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useTranslation('web');
  const [title, setTitle] = useState('');
  const [role, setRole] = useState<GovernanceBoardRole>('MEMBER');
  const [seats, setSeats] = useState('1');
  const [closeAt, setCloseAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const seatCount = Number(seats);
        if (!title.trim()) {
          setError('Give the election a title.');
          return;
        }
        if (!Number.isInteger(seatCount) || seatCount < 1 || seatCount > 20) {
          setError('Seats must be a whole number from 1 to 20.');
          return;
        }
        setBusy(true);
        setError(null);
        void createAdminElection({
          title,
          role,
          seats: seatCount,
          ...(closeAt ? { nominationsCloseAt: closeAt } : {}),
        }).then((result) => {
          setBusy(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          onClose();
          setTitle('');
          setCloseAt('');
          onCreated();
        });
      }}
    >
      <Input
        label={t('electionsAdminPanel.title')}
        value={title}
        maxLength={200}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Select
        label={t('electionsAdminPanel.role')}
        value={role}
        onValueChange={(value) => {
          setRole(value as GovernanceBoardRole);
          if (value === 'CHAIR') {
            setSeats('1');
          }
        }}
        options={BOARD_ROLE_OPTIONS}
      />
      <div className="flex flex-wrap gap-2">
        <Input
          label={t('electionsAdminPanel.seats')}
          inputMode="numeric"
          value={seats}
          disabled={role === 'CHAIR'}
          onChange={(e) => setSeats(e.target.value)}
        />
        <Input
          label={t('electionsAdminPanel.nominationsCloseOptional')}
          type="date"
          value={closeAt}
          onChange={(e) => setCloseAt(e.target.value)}
        />
      </div>
      {error ? <InlineError>{error}</InlineError> : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          {t('electionsAdminPanel.callElection')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => onClose()}
        >
          {t('electionsAdminPanel.cancel')}
        </Button>
      </div>
    </form>
  );
}

/** Board elections: call one, follow it to the result. */
export function ElectionsAdminPanel() {
  const { t } = useTranslation('web');
  const [elections, setElections] = useState<AdminElection[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const showEmpty = elections?.length === 0 && !loadError;

  const load = useCallback(async () => {
    const result = await fetchAdminElections();
    setElections(result.data);
    setLoadError(
      result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <StudioPanel title={t('electionsAdminPanel.elections')}>
      {composing ? (
        <NewElectionForm
          onClose={() => setComposing(false)}
          onCreated={() => void load()}
        />
      ) : elections === null || showEmpty ? null : (
        <Button size="sm" className="w-fit" onClick={() => setComposing(true)}>
          <PlusIcon size={16} aria-hidden />
          {t('adminGovernance.callElection')}
        </Button>
      )}
      {elections === null ? (
        <PageLoading label={t('loading.loadingElections')} />
      ) : loadError && elections.length === 0 ? (
        <PageError
          title={t('loadErrors.couldNotLoadElections')}
          description={loadError}
          onRetry={() => {
            setElections(null);
            void load();
          }}
        />
      ) : elections.length === 0 ? (
        <PageEmpty
          title={t('empties.noElectionsCalledYet')}
          action={
            composing ? undefined : (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setComposing(true)}
              >
                <PlusIcon size={16} aria-hidden />
                {t('adminGovernance.callElection')}
              </Button>
            )
          }
        />
      ) : (
        <ul className="divide-border divide-y">
          {elections.map((election) => {
            const stage = electionStage(election);
            return (
              <li
                key={election.id}
                className="flex flex-col gap-1 py-2 text-sm first:pt-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{election.title}</span>
                  <Badge variant="pill" color={stage.color}>
                    {stage.label}
                  </Badge>
                </div>
                <p className="text-foreground-secondary text-xs">
                  {BOARD_ROLE_LABELS[election.role]} ·{' '}
                  {election.seats === 1 ? '1 seat' : `${election.seats} seats`}
                  {election.nominationsCloseAt
                    ? ` · nominations close ${numericDay(election.nominationsCloseAt)}`
                    : ''}
                  {election.cancelReason ? ` · ${election.cancelReason}` : ''}
                </p>
                <ElectionCandidates
                  election={election}
                  onDecided={() => void load()}
                />
                <ElectionActions
                  election={election}
                  onChanged={() => void load()}
                />
              </li>
            );
          })}
        </ul>
      )}
    </StudioPanel>
  );
}
