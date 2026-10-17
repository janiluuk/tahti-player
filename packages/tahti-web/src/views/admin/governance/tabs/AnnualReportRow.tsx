import { Badge } from '@tahti-player/ui';

import type { AdminAnnualReport } from '../../../../api/admin';

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Where the report stands, newest step first. */
export function annualReportStage(report: AdminAnnualReport): {
  label: string;
  color: 'secondary' | 'yellow' | 'green' | 'blue';
} {
  if (report.publishedAt) {
    return { label: 'Published', color: 'green' };
  }
  if (report.approvedAt) {
    return { label: 'Approved, not published', color: 'blue' };
  }
  return { label: 'Draft', color: 'yellow' };
}

function reportTimeline(report: AdminAnnualReport): string {
  const parts = [`Generated ${formatDay(report.generatedAt)}`];
  if (report.approvedAt) {
    parts.push(`approved ${formatDay(report.approvedAt)}`);
  }
  if (report.publishedAt) {
    parts.push(`published ${formatDay(report.publishedAt)}`);
  }
  if (report.filedAt) {
    parts.push(
      `filed ${formatDay(report.filedAt)}${report.filingReference ? ` (${report.filingReference})` : ''}`,
    );
  }
  if (report.correctedAt) {
    parts.push(`corrected ${formatDay(report.correctedAt)}`);
  }
  return parts.join(' · ');
}

export function AnnualReportRow({ report }: { report: AdminAnnualReport }) {
  const stage = annualReportStage(report);
  return (
    <li className="flex flex-col gap-1.5 py-3 text-sm first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">Annual report {report.year}</span>
        <Badge variant="pill" color={stage.color}>
          {stage.label}
        </Badge>
        {report.legalHoldAt ? (
          <Badge variant="pill" color="red">
            On legal hold
          </Badge>
        ) : null}
        {report.downloadUrl ? (
          <a
            href={report.downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-xs underline-offset-2 hover:underline"
          >
            Download
          </a>
        ) : null}
      </div>
      <p className="text-foreground-secondary text-xs">
        {reportTimeline(report)}
      </p>
    </li>
  );
}
