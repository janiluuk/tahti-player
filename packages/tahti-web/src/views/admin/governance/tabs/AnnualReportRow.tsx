import { useTranslation, type TFunction } from '@tahti-player/i18n';
import { Badge, ExternalLink } from '@tahti-player/ui';

import type { AdminAnnualReport } from '../../../../api/admin';
import type { GovernanceMeeting } from '../../../../api/types';
import { relativeDate } from '../../../../lib/relativeDate';
import { AnnualReportActions } from './AnnualReportActions';

/** Where the report stands, newest step first. */
export function annualReportStage(
  t: TFunction<'web'>,
  report: AdminAnnualReport,
): {
  label: string;
  color: 'secondary' | 'yellow' | 'green' | 'blue';
} {
  if (report.publishedAt) {
    return {
      label: t('annualReportRowBatch33.stagePublished'),
      color: 'green',
    };
  }
  if (report.approvedAt) {
    return { label: t('annualReportRowBatch33.stageApproved'), color: 'blue' };
  }
  return { label: t('annualReportRowBatch33.stageDraft'), color: 'yellow' };
}

function reportTimeline(
  t: TFunction<'web'>,
  report: AdminAnnualReport,
): string {
  const parts = [
    t('annualReportRowBatch33.generated', {
      when: relativeDate(report.generatedAt),
    }),
  ];
  if (report.approvedAt) {
    parts.push(
      t('annualReportRowBatch33.approved', {
        when: relativeDate(report.approvedAt),
      }),
    );
  }
  if (report.publishedAt) {
    parts.push(
      t('annualReportRowBatch33.published', {
        when: relativeDate(report.publishedAt),
      }),
    );
  }
  if (report.filedAt) {
    const when = relativeDate(report.filedAt);
    parts.push(
      report.filingReference
        ? t('annualReportRowBatch33.filedWithReference', {
            when,
            reference: report.filingReference,
          })
        : t('annualReportRowBatch33.filed', { when }),
    );
  }
  if (report.correctedAt) {
    parts.push(
      t('annualReportRowBatch33.corrected', {
        when: relativeDate(report.correctedAt),
      }),
    );
  }
  return parts.join(' · ');
}

export function AnnualReportRow({
  report,
  meetings,
  onChanged,
}: {
  report: AdminAnnualReport;
  meetings: GovernanceMeeting[];
  onChanged: () => void;
}) {
  const { t } = useTranslation('web');
  const stage = annualReportStage(t, report);
  return (
    <li className="flex flex-col gap-1.5 py-3 text-sm first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">
          {t('annualReportRowBatch33.title', { year: report.year })}
        </span>
        <Badge variant="pill" color={stage.color}>
          {stage.label}
        </Badge>
        {report.legalHoldAt ? (
          <Badge variant="pill" color="red">
            {t('annualReportRow.onLegalHold')}
          </Badge>
        ) : null}
        {report.downloadUrl ? (
          <ExternalLink
            href={report.downloadUrl}
            className="ml-auto text-xs no-underline underline-offset-2 hover:underline"
          >
            {t('annualReportRow.download')}
          </ExternalLink>
        ) : null}
      </div>
      <p className="text-foreground-secondary text-xs">
        {reportTimeline(t, report)}
      </p>
      <AnnualReportActions
        report={report}
        meetings={meetings}
        onChanged={onChanged}
      />
    </li>
  );
}
