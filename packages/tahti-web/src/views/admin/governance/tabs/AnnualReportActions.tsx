import { useState } from 'react';

import { Button, Select } from '@tahti-player/ui';

import {
  approveAnnualReport,
  publishAnnualReport,
  type AdminAnnualReport,
  type AnnualReportResult,
} from '../../../../api/admin/admin-annual-reports';
import type { GovernanceMeeting } from '../../../../api/types';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import { AnnualReportCorrection } from './AnnualReportCorrection';
import { AnnualReportFilingForm } from './AnnualReportFilingForm';
import { AnnualReportLegalHold } from './AnnualReportLegalHold';

const NO_MEETING = '';

/** The next steps the board can take on one annual report. */
export function AnnualReportActions({
  report,
  meetings,
  onChanged,
}: {
  report: AdminAnnualReport;
  meetings: GovernanceMeeting[];
  onChanged: () => void;
}) {
  const [approving, setApproving] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [meetingId, setMeetingId] = useState(NO_MEETING);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (action: () => Promise<AnnualReportResult>) => {
    setBusy(true);
    setError(null);
    void action().then((result) => {
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setApproving(false);
      onChanged();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {!report.approvedAt ? (
        approving ? (
          <div className="flex flex-wrap items-end gap-2">
            <Select
              label="Approved at"
              value={meetingId}
              onValueChange={setMeetingId}
              options={[
                { id: NO_MEETING, label: 'No meeting named' },
                ...meetings.map((meeting) => ({
                  id: meeting.id,
                  label: meeting.title,
                })),
              ]}
            />
            <Button
              size="sm"
              disabled={busy}
              onClick={() =>
                run(() =>
                  approveAnnualReport(report.year, meetingId || undefined),
                )
              }
            >
              Record approval
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => setApproving(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            className="w-fit"
            onClick={() => setApproving(true)}
          >
            Approve report {report.year}
          </Button>
        )
      ) : null}
      {report.approvedAt && !report.publishedAt ? (
        <Button
          size="sm"
          className="w-fit"
          disabled={busy}
          onClick={() => setConfirmPublish(true)}
        >
          Publish to members
        </Button>
      ) : null}
      <AnnualReportFilingForm report={report} onChanged={onChanged} />
      <AnnualReportCorrection report={report} onChanged={onChanged} />
      <AnnualReportLegalHold report={report} onChanged={onChanged} />
      <ConfirmDialog
        isOpen={confirmPublish}
        title={`Publish annual report ${report.year}?`}
        description="Members will be able to read and download it from Governance."
        confirmLabel="Publish"
        onCancel={() => setConfirmPublish(false)}
        onConfirm={() => {
          setConfirmPublish(false);
          run(() => publishAnnualReport(report.year));
        }}
      />
      {error ? (
        <p role="alert" className="text-accent-red-strong text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
