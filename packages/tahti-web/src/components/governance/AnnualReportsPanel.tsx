import { BookOpenIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { ExternalLink, InlineLoader } from '@tahti-player/ui';

import {
  fetchAnnualReports,
  type PublishedAnnualReport,
} from '../../api/governance-annual-reports';
import { ListingDate } from '../ListingDate';
import { PageEmpty, PageError } from '../PageStates';
import { GovernancePanel } from './GovernancePanel';

function ReportDetails({ report }: { report: PublishedAnnualReport }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1">
      <span>Approved</span>
      <ListingDate value={report.approvedAt} />
      {report.filedAt ? (
        <>
          <span>· filed with the register</span>
          <ListingDate value={report.filedAt} />
        </>
      ) : null}
      {report.correctedAt ? (
        <>
          <span>· corrected</span>
          <ListingDate value={report.correctedAt} />
        </>
      ) : null}
    </span>
  );
}

/** Yearly reports the board approved and published
 * (GET /api/v1/governance/annual-reports). */
export function AnnualReportsPanel() {
  const { t } = useTranslation('web');
  const [reports, setReports] = useState<PublishedAnnualReport[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchAnnualReports().then((result) => {
      if (cancelled) {
        return;
      }
      setReports(result.data);
      setLoadError(
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <GovernancePanel title="Annual reports" icon={BookOpenIcon}>
      {reports === null ? (
        <InlineLoader label="Loading annual reports…" />
      ) : loadError ? (
        <PageError
          title={t('loadErrors.couldNotLoadTheAnnualReports')}
          description={loadError}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      ) : reports.length === 0 ? (
        <PageEmpty title={t('empties.noAnnualReport')} />
      ) : (
        <ul className="divide-border divide-y">
          {reports.map((report) => (
            <li key={report.year} className="py-2 text-sm first:pt-0 last:pb-0">
              {report.downloadUrl ? (
                <ExternalLink
                  href={report.downloadUrl}
                  className="font-medium no-underline underline-offset-2 hover:underline"
                >
                  Annual report {report.year}
                </ExternalLink>
              ) : (
                <span className="font-medium">Annual report {report.year}</span>
              )}
              <div className="text-foreground-secondary mt-0.5 text-xs">
                <ReportDetails report={report} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </GovernancePanel>
  );
}
