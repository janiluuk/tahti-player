import { useCallback, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button, InlineError, Input } from '@tahti-player/ui';

import {
  fetchAdminElectionCandidates,
  nominateElectionCandidate,
  type AdminElection,
  type AdminElectionCandidate,
} from '../../../../api/admin/admin-governance-elections';
import { ElectionResultForm } from './ElectionResultForm';
import { MemberPicker, type PickedMember } from './MemberPicker';

function CandidateLine({ candidate }: { candidate: AdminElectionCandidate }) {
  const { t } = useTranslation('web');
  return (
    <li className="text-xs">
      <span
        className={
          candidate.withdrawnAt ? 'font-semibold line-through' : 'font-semibold'
        }
      >
        {candidate.displayName}
      </span>
      <span className="text-foreground-secondary ml-1.5">
        {candidate.selfNominated
          ? 'stood themselves'
          : 'nominated by the board'}
        {candidate.withdrawnAt ? ' · withdrew' : ''}
      </span>
      {candidate.elected ? (
        <Badge variant="pill" color="green" className="ml-1.5">
          {t('electionCandidates.elected')}
        </Badge>
      ) : null}
      {candidate.statement ? (
        <p className="text-foreground-secondary">{candidate.statement}</p>
      ) : null}
    </li>
  );
}

/** Who is standing in an election, and nominating a member. */
export function ElectionCandidates({
  election,
  onCandidates,
  onDecided,
}: {
  election: AdminElection;
  onCandidates?: (candidates: AdminElectionCandidate[]) => void;
  onDecided?: () => void;
}) {
  const { t } = useTranslation('web');
  const [candidates, setCandidates] = useState<AdminElectionCandidate[] | null>(
    null,
  );
  const [nominating, setNominating] = useState(false);
  const [member, setMember] = useState<PickedMember | null>(null);
  const [statement, setStatement] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = !election.decidedAt && !election.cancelledAt;

  const load = useCallback(async () => {
    const result = await fetchAdminElectionCandidates(election.id);
    setCandidates(result.data);
    onCandidates?.(result.data);
  }, [election.id, onCandidates]);

  if (candidates === null) {
    return (
      <Button
        size="sm"
        variant="secondary"
        className="w-fit"
        aria-label={`Candidates: ${election.title}`}
        onClick={() => void load()}
      >
        {t('electionCandidates.candidates')}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {candidates.length === 0 ? (
        <p className="text-foreground-secondary text-xs">
          {t('electionCandidates.nobodyIsStandingYet')}
        </p>
      ) : (
        <ul
          aria-label={`Candidates in ${election.title}`}
          className="flex flex-col gap-1"
        >
          {candidates.map((candidate) => (
            <CandidateLine key={candidate.id} candidate={candidate} />
          ))}
        </ul>
      )}
      {open && !nominating ? (
        <Button
          size="sm"
          variant="secondary"
          className="w-fit"
          onClick={() => setNominating(true)}
        >
          {t('electionCandidates.nominateAMember')}
        </Button>
      ) : null}
      {open && nominating ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!member) {
              setError('Choose the member to nominate.');
              return;
            }
            setBusy(true);
            setError(null);
            void nominateElectionCandidate(
              election.id,
              { userId: member.id, displayName: member.displayName },
              statement,
            ).then((result) => {
              setBusy(false);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setNominating(false);
              setMember(null);
              setStatement('');
              void load();
            });
          }}
        >
          <MemberPicker
            label={t('electionCandidates.nominee')}
            value={member}
            onChange={setMember}
          />
          <Input
            label={t('electionCandidates.statementOptional')}
            value={statement}
            maxLength={2000}
            onChange={(e) => setStatement(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy}>
              {t('electionCandidates.nominate')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => setNominating(false)}
            >
              {t('electionCandidates.cancel')}
            </Button>
          </div>
        </form>
      ) : null}
      {error ? <InlineError textSize="xs">{error}</InlineError> : null}
      <ElectionResultForm
        election={election}
        candidates={candidates}
        onRecorded={() => {
          void load();
          onDecided?.();
        }}
      />
    </div>
  );
}
