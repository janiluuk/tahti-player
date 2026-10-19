import { BookOpenIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  fetchAnnualReports,
  type PublishedAnnualReport,
} from '../../api/governance-annual-reports';
import { GovernancePanel } from './GovernancePanel';

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function reportDetails(report: PublishedAnnualReport): string {
  const parts = [`Approved ${formatDay(report.approvedAt)}`];
  if (report.filedAt) {
    parts.push(`filed with the register ${formatDay(report.filedAt)}`);
  }
  if (report.correctedAt) {
    parts.push(`corrected ${formatDay(report.correctedAt)}`);
  }
  return parts.join(' · ');
}

/** Yearly reports the board approved and published
 * (GET /api/v1/governance/annual-reports). */
export function AnnualReportsPanel() {
  const [reports, setReports] = useState<PublishedAnnualReport[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchAnnualReports().then((result) => {
      if (cancelled) {
        return;
      }
      setReports(result.data);
      setFailed(result.meta.source === 'api' && Boolean(result.meta.reason));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GovernancePanel title="Annual reports" icon={BookOpenIcon}>
      {reports === null ? (
        <p className="text-foreground-secondary text-sm">
          Loading annual reports…
        </p>
      ) : failed ? (
        <p className="text-foreground-secondary text-sm">
          Could not load the annual reports. Try again later.
        </p>
      ) : reports.length === 0 ? (
        <PageEmpty title="No annual report has been published yet." />
      ) : (
        <ul className="divide-border divide-y">
          {reports.map((report) => (
            <li key={report.year} className="py-2 text-sm first:pt-0 last:pb-0">
              {report.downloadUrl ? (
                <a
                  href={report.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline-offset-2 hover:underline"
                >
                  Annual report {report.year}
                </a>
              ) : (
                <span className="font-medium">Annual report {report.year}</span>
              )}
              <div className="text-foreground-secondary mt-0.5 text-xs">
                {reportDetails(report)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </GovernancePanel>
  );
}
