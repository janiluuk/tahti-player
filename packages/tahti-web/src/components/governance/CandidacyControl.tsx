import { useId, useState } from 'react';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Button, InlineError, Textarea } from '@tahti-player/ui';

import {
  standForElection,
  withdrawCandidacy,
  type GovernanceElection,
} from '../../api/governance-elections';
import { ConfirmDialog } from '../ConfirmDialog';

const STATEMENT_MAX = 2000;

/** Stand in an election while nominations are open, or withdraw until the
 * result is recorded. */
export function CandidacyControl({
  election,
  onChanged,
}: {
  election: GovernanceElection;
  onChanged: () => void;
}) {
  const { t } = useTranslation('web');
  const statementId = useId();
  const [writing, setWriting] = useState(false);
  const [statement, setStatement] = useState('');
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closed = Boolean(election.decidedAt || election.cancelledAt);

  if (closed || (!election.youAreCandidate && !election.nominationsOpen)) {
    return null;
  }

  const run = (action: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(true);
    setError(null);
    void action().then((result) => {
      setBusy(false);
      if (!result.ok) {
        setError(
          result.error ?? i18n.t('web:appErrorFallback.somethingWentWrong'),
        );
        return;
      }
      setWriting(false);
      setStatement('');
      onChanged();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {election.youAreCandidate ? (
        <Button
          size="sm"
          variant="secondary"
          className="w-fit"
          disabled={busy}
          onClick={() => setConfirmWithdraw(true)}
        >
          {t('candidacy.withdrawMyCandidacy')}
        </Button>
      ) : writing ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => standForElection(election.id, statement));
          }}
        >
          <Textarea
            submitOnModEnter
            id={statementId}
            label={t('candidacy.whyYouAreStandingOptional')}
            value={statement}
            maxLength={STATEMENT_MAX}
            rows={3}
            onChange={(e) => setStatement(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy}>
              {busy
                ? t('candidacyControlStates.sending')
                : t('candidacyControlStates.standInThisElection')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => setWriting(false)}
            >
              {t('candidacy.cancel')}
            </Button>
          </div>
        </form>
      ) : (
        <Button size="sm" className="w-fit" onClick={() => setWriting(true)}>
          {t('candidacy.standForElection')}
        </Button>
      )}
      {error && <InlineError textSize="xs">{error}</InlineError>}
      <ConfirmDialog
        destructive
        isOpen={confirmWithdraw}
        title={t('candidacy.withdrawYourCandidacy')}
        description={t('candidacyControlLabels.youWillNoLongerStand', {
          title: election.title,
        })}
        confirmLabel={t('candidacy.withdraw')}
        onCancel={() => setConfirmWithdraw(false)}
        onConfirm={() => {
          setConfirmWithdraw(false);
          run(() => withdrawCandidacy(election.id));
        }}
      />
    </div>
  );
}
