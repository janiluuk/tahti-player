import { VoteIcon } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, InlineLoader } from '@tahti-player/ui';

import { BOARD_ROLE_LABELS } from '../../api/governance-board';
import {
  fetchGovernanceElections,
  type GovernanceElection,
} from '../../api/governance-elections';
import { webT } from '../../lib/webT';
import { ListingDate } from '../ListingDate';
import { PageEmpty, PageError } from '../PageStates';
import { CandidacyControl } from './CandidacyControl';
import { GovernancePanel } from './GovernancePanel';

function electionStatus(election: GovernanceElection): ReactNode {
  if (election.cancelledAt) {
    return election.cancelReason
      ? `Cancelled: ${election.cancelReason}`
      : 'Cancelled';
  }
  if (election.decidedAt) {
    return (
      <>
        {webT()('electionsPanelText.decided')}{' '}
        <ListingDate value={election.decidedAt} />
      </>
    );
  }
  if (election.nominationsOpen) {
    return election.nominationsCloseAt ? (
      <>
        Nominations open until{' '}
        <ListingDate value={election.nominationsCloseAt} />
      </>
    ) : (
      'Nominations open'
    );
  }
  return 'Nominations closed, waiting for the meeting';
}

function ElectionItem({
  election,
  onChanged,
}: {
  election: GovernanceElection;
  onChanged: () => void;
}) {
  const { t } = useTranslation('web');
  const seats = election.seats === 1 ? '1 seat' : `${election.seats} seats`;
  return (
    <li className="flex flex-col gap-1.5 py-3 text-sm first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{election.title}</span>
        {election.youAreCandidate ? (
          <Badge variant="pill" color="green">
            {t('electionsPanel.youAreStanding')}
          </Badge>
        ) : null}
      </div>
      <div className="text-foreground-secondary text-xs">
        {BOARD_ROLE_LABELS[election.role]} · {seats} ·{' '}
        {electionStatus(election)}
      </div>
      {election.candidates.length === 0 ? (
        <PageEmpty title={t('empties.noCandidates')} />
      ) : (
        <ul
          aria-label={t('electionsPanelLabels.candidatesInTitle', {
            title: election.title,
          })}
          className="flex flex-col gap-1"
        >
          {election.candidates.map((candidate) => (
            <li
              key={candidate.username ?? candidate.displayName}
              className="text-xs"
            >
              <span className="font-semibold">{candidate.displayName}</span>
              {candidate.username ? (
                <span className="text-foreground-secondary ml-1.5">
                  @{candidate.username}
                </span>
              ) : null}
              {candidate.elected ? (
                <Badge variant="pill" color="green" className="ml-1.5">
                  {t('electionsPanel.elected')}
                </Badge>
              ) : null}
              {candidate.statement ? (
                <p className="text-foreground-secondary mt-0.5">
                  {candidate.statement}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <CandidacyControl election={election} onChanged={onChanged} />
    </li>
  );
}

/** Board elections with the members standing in them
 * (GET /api/v1/governance/elections). */
export function ElectionsPanel() {
  const { t } = useTranslation('web');
  const [elections, setElections] = useState<GovernanceElection[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await fetchGovernanceElections();
    setElections(result.data);
    setLoadError(
      result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <GovernancePanel title={t('electionsPanel.boardElections')} icon={VoteIcon}>
      {elections === null ? (
        <InlineLoader label={t('electionsPanel.loadingElections')} />
      ) : loadError ? (
        <PageError
          title={t('loadErrors.couldNotLoadTheElections')}
          description={loadError}
          onRetry={() => void load()}
        />
      ) : elections.length === 0 ? (
        <PageEmpty title={t('empties.noElections')} />
      ) : (
        <ul className="divide-border divide-y">
          {elections.map((election) => (
            <ElectionItem
              key={election.id}
              election={election}
              onChanged={() => void load()}
            />
          ))}
        </ul>
      )}
    </GovernancePanel>
  );
}
