import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, ExternalLink, InlineError, Textarea } from '@tahti-player/ui';

import {
  correctAnnualReport,
  fetchAnnualReportRevisions,
  type AdminAnnualReport,
  type AnnualReportRevision,
} from '../../../../api/admin/admin-annual-reports';
import { PageEmpty } from '../../../../components/PageStates';
import { relativeDate } from '../../../../lib/relativeDate';

/** Correct an approved report and list the versions corrections replaced. */
export function AnnualReportCorrection({
  report,
  onChanged,
}: {
  report: AdminAnnualReport;
  onChanged: () => void;
}) {
  const { t } = useTranslation('web');
  const [writing, setWriting] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revisions, setRevisions] = useState<AnnualReportRevision[] | null>(
    null,
  );

  if (!report.approvedAt) {
    return null;
  }

  const showRevisions = () => {
    void fetchAnnualReportRevisions(report.year).then((result) =>
      setRevisions(result.data),
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {!writing && !report.legalHoldAt ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setWriting(true)}
          >
            {t('annualReportCorrection.correctReport')}
          </Button>
        ) : null}
        {report.correctedAt && revisions === null ? (
          <Button size="sm" variant="secondary" onClick={showRevisions}>
            {t('annualReportCorrection.earlierVersions')}
          </Button>
        ) : null}
      </div>
      {writing ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!note.trim()) {
              setError('Say what the correction changes.');
              return;
            }
            setBusy(true);
            setError(null);
            void correctAnnualReport(report.year, note).then((result) => {
              setBusy(false);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setWriting(false);
              setNote('');
              setRevisions(null);
              onChanged();
            });
          }}
        >
          <Textarea
            submitOnModEnter
            label={t('annualReportCorrection.whatDoesTheCorrectionChange')}
            description={t('annualReportCorrection.theReportIsRegeneratedFrom')}
            rows={2}
            value={note}
            maxLength={2000}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy}>
              {t('annualReportCorrection.regenerateCorrectedReport')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => setWriting(false)}
            >
              {t('annualReportCorrection.cancel')}
            </Button>
          </div>
        </form>
      ) : null}
      {error ? <InlineError textSize="xs">{error}</InlineError> : null}
      {revisions !== null ? (
        revisions.length === 0 ? (
          <PageEmpty title={t('empties.noEarlierVersionsAreKept')} />
        ) : (
          <ul
            aria-label={t('annualReportCorrection.earlierVersions')}
            className="flex flex-col gap-1"
          >
            {revisions.map((revision) => (
              <li key={revision.id} className="text-xs">
                <span className="font-medium">
                  Replaced {relativeDate(revision.replacedAt)}
                </span>
                {revision.downloadUrl ? (
                  <ExternalLink
                    href={revision.downloadUrl}
                    className="ml-2 no-underline underline-offset-2 hover:underline"
                  >
                    {t('annualReportCorrection.download')}
                  </ExternalLink>
                ) : null}
                <p className="text-foreground-secondary">{revision.note}</p>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
