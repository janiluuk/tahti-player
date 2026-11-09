import { PencilLineIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button, InlineError, Select, Textarea } from '@tahti-player/ui';

import {
  CORRECTION_DETAILS_MAX,
  CORRECTION_DETAILS_MIN,
  CORRECTION_SUBJECT_LABELS,
  fetchMyCorrections,
  requestCorrection,
  withdrawCorrection,
  type CorrectionState,
  type CorrectionSubject,
  type GovernanceCorrection,
} from '../../api/governance-corrections';
import { ConfirmDialog } from '../ConfirmDialog';
import { ListingDate } from '../ListingDate';
import { PageError } from '../PageStates';
import { GovernancePanel } from './GovernancePanel';

const STATE_LABELS: Record<
  CorrectionState,
  { label: string; color: 'yellow' | 'green' | 'red' | 'secondary' }
> = {
  OPEN: { label: 'Waiting for the board', color: 'yellow' },
  ACCEPTED: { label: 'Accepted', color: 'green' },
  REJECTED: { label: 'Rejected', color: 'red' },
  WITHDRAWN: { label: 'Withdrawn', color: 'secondary' },
};

function CorrectionItem({
  correction,
  onChanged,
}: {
  correction: GovernanceCorrection;
  onChanged: () => void;
}) {
  const { t } = useTranslation('web');
  const state = STATE_LABELS[correction.state];
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withdraw = () => {
    setConfirming(false);
    setBusy(true);
    setError(null);
    void withdrawCorrection(correction.id).then((result) => {
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onChanged();
    });
  };

  return (
    <li className="flex flex-col gap-1 py-2 text-sm first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">
          {CORRECTION_SUBJECT_LABELS[correction.subject]}
        </span>
        <Badge variant="pill" color={state.color}>
          {state.label}
        </Badge>
      </div>
      <p className="text-foreground-secondary text-xs">
        {t('correctionsPanel.sent')}{' '}
        <ListingDate value={correction.createdAt} />
      </p>
      <p className="whitespace-pre-line">{correction.details}</p>
      {correction.resolutionNote ? (
        <p className="text-foreground-secondary text-xs">
          Board's answer: {correction.resolutionNote}
        </p>
      ) : null}
      {correction.state === 'OPEN' ? (
        <Button
          size="sm"
          variant="secondary"
          className="w-fit"
          disabled={busy}
          onClick={() => setConfirming(true)}
        >
          {t('correctionsPanel.withdrawRequest')}
        </Button>
      ) : null}
      {error ? <InlineError textSize="xs">{error}</InlineError> : null}
      <ConfirmDialog
        destructive
        isOpen={confirming}
        title={t('correctionsPanel.withdrawThisRequest')}
        description={t('correctionsPanel.theBoardWillNotAnswer')}
        confirmLabel={t('correctionsPanel.withdraw')}
        onCancel={() => setConfirming(false)}
        onConfirm={withdraw}
      />
    </li>
  );
}

/** Ask the board to correct your member-register data or a governance
 * record, and follow its answer (/api/v1/governance/corrections). */
export function CorrectionsPanel() {
  const { t } = useTranslation('web');
  const [corrections, setCorrections] = useState<GovernanceCorrection[] | null>(
    null,
  );
  const [subject, setSubject] = useState<CorrectionSubject>('MEMBER_REGISTER');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await fetchMyCorrections();
    setCorrections(result.data);
    setLoadError(
      result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const tooShort = details.trim().length < CORRECTION_DETAILS_MIN;

  return (
    <GovernancePanel
      title={t('correctionsPanel.requestACorrection')}
      icon={PencilLineIcon}
    >
      <p className="text-foreground-secondary text-sm">
        {t('correctionsPanel.somethingWrongInYourMember')}
      </p>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (tooShort) {
            setError('Say what is wrong and what it should be.');
            return;
          }
          setBusy(true);
          setError(null);
          setSent(false);
          void requestCorrection({ subject, details }).then((result) => {
            setBusy(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setDetails('');
            setSent(true);
            void load();
          });
        }}
      >
        <Select
          label={t('correctionsPanel.whatNeedsCorrecting')}
          value={subject}
          onValueChange={(value) => setSubject(value as CorrectionSubject)}
          options={(
            Object.keys(CORRECTION_SUBJECT_LABELS) as CorrectionSubject[]
          ).map((id) => ({ id, label: CORRECTION_SUBJECT_LABELS[id] }))}
        />
        <Textarea
          submitOnModEnter
          label={t('correctionsPanel.whatIsWrongAndWhat')}
          rows={3}
          value={details}
          maxLength={CORRECTION_DETAILS_MAX}
          onChange={(e) => setDetails(e.target.value)}
        />
        <Button type="submit" size="sm" className="w-fit" disabled={busy}>
          {busy
            ? t('correctionsPanelStates.sending')
            : t('correctionsPanelStates.sendToTheBoard')}
        </Button>
        {error ? <InlineError textSize="xs">{error}</InlineError> : null}
        {sent ? (
          <p role="status" className="text-xs">
            {t('correctionsPanel.sentTheBoardWillAnswer')}
          </p>
        ) : null}
      </form>
      {corrections && corrections.length > 0 ? (
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">
            {t('correctionsPanel.yourRequests')}
          </h3>
          <ul className="divide-border divide-y">
            {corrections.map((correction) => (
              <CorrectionItem
                key={correction.id}
                correction={correction}
                onChanged={() => void load()}
              />
            ))}
          </ul>
        </div>
      ) : loadError ? (
        <PageError
          title={t('loadErrors.couldNotLoadYourRequests')}
          description={loadError}
          onRetry={() => void load()}
        />
      ) : null}
    </GovernancePanel>
  );
}
