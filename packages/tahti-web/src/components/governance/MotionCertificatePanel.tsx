import { ShieldCheckIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@tahti-player/ui';

import {
  fetchMotionCertificate,
  type MotionCertificate,
  type MotionTally,
} from '../../api/governance-motion-certificate';
import { GovernancePanel } from './GovernancePanel';
import { MotionResultCorrectionForm } from './MotionResultCorrectionForm';

function tallyText(tally: MotionTally): string {
  return `${tally.YES} yes · ${tally.NO} no · ${tally.ABSTAIN} abstain`;
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** The closed motion's result certificate: the count fixed at closing, a
 * check that the record still produces it, and any board corrections. */
export function MotionCertificatePanel({
  motionId,
  isBoard = false,
}: {
  motionId: string;
  isBoard?: boolean;
}) {
  const [certificate, setCertificate] = useState<MotionCertificate | null>(
    null,
  );

  const load = useCallback(async () => {
    const result = await fetchMotionCertificate(motionId);
    setCertificate(result.data);
  }, [motionId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!certificate) {
    return null;
  }

  return (
    <GovernancePanel title="Result certificate" icon={ShieldCheckIcon}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{tallyText(certificate.tally)}</span>
        <span className="text-foreground-secondary text-xs">
          {certificate.totalVotes} votes
          {certificate.eligibleMemberCount !== null
            ? ` of ${certificate.eligibleMemberCount} eligible members`
            : ''}{' '}
          · closed {formatDay(certificate.closedAt)}
          {certificate.advisory ? ' · advisory' : ''}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge
          variant="pill"
          color={certificate.matchesRecord ? 'green' : 'red'}
        >
          {certificate.matchesRecord
            ? 'Matches the record'
            : 'Does not match the record'}
        </Badge>
        <code className="text-foreground-secondary break-all">
          {certificate.algorithm} {certificate.digest}
        </code>
      </div>
      {certificate.correctedTally ? (
        <p className="text-sm">
          Corrected count: {tallyText(certificate.correctedTally)}
        </p>
      ) : null}
      {certificate.corrections.length > 0 ? (
        <ul aria-label="Corrections" className="flex flex-col gap-1 text-xs">
          {certificate.corrections.map((correction) => (
            <li key={correction.id}>
              <span className="font-medium">
                Corrected {formatDay(correction.createdAt)}
              </span>
              {correction.tally ? ` · ${tallyText(correction.tally)}` : ''}
              {correction.matchesRecord ? '' : ' · does not chain'}
              <p className="text-foreground-secondary">{correction.note}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {isBoard ? (
        <MotionResultCorrectionForm
          motionId={motionId}
          current={certificate.correctedTally ?? certificate.tally}
          onCorrected={() => void load()}
        />
      ) : null}
    </GovernancePanel>
  );
}
