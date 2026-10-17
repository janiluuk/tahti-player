import { FileTextIcon, LoaderCircleIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button, Input } from '@tahti-player/ui';

import {
  fetchAdminAnnualReports,
  fetchAdminGovernanceMeetings,
  generateAdminAnnualReport,
  type AdminAnnualReport,
} from '../../../../api/admin';
import type { GovernanceMeeting } from '../../../../api/types';
import { PageEmpty, PageLoading } from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';
import { AnnualReportRow } from './AnnualReportRow';

export function ReportsTab() {
  const [reports, setReports] = useState<AdminAnnualReport[]>([]);
  const [year, setYear] = useState(String(new Date().getUTCFullYear() - 1));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<GovernanceMeeting[]>([]);

  const load = useCallback(async () => {
    const result = await fetchAdminAnnualReports();
    setReports(result.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    void fetchAdminGovernanceMeetings().then((result) =>
      setMeetings(result.data),
    );
  }, [load]);

  return (
    <>
      <StudioPanel title="Generate report">
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-foreground-secondary flex flex-col gap-1 text-xs">
            Year
            <Input
              value={year}
              onChange={(event) => setYear(event.target.value)}
              inputMode="numeric"
              className="w-28"
            />
          </label>
          <Button
            size="sm"
            disabled={busy || !/^20\d{2}$/.test(year)}
            onClick={() => {
              setBusy(true);
              setError(null);
              void generateAdminAnnualReport(Number(year)).then((result) => {
                setBusy(false);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                void load();
              });
            }}
          >
            {busy ? (
              <LoaderCircleIcon
                size={14}
                aria-hidden
                className="mr-1.5 animate-spin"
              />
            ) : (
              <FileTextIcon size={14} aria-hidden className="mr-1.5" />
            )}
            {busy ? 'Generating…' : 'Generate report'}
          </Button>
        </div>
        {error ? (
          <p role="alert" className="text-accent-red-strong mt-2 text-sm">
            {error}
          </p>
        ) : null}
      </StudioPanel>
      <StudioPanel title="Generated reports">
        {loading ? (
          <PageLoading label="Loading reports…" />
        ) : reports.length === 0 ? (
          <PageEmpty title="No annual reports generated yet" />
        ) : (
          <ul className="divide-border divide-y">
            {reports.map((report) => (
              <AnnualReportRow
                key={report.id}
                report={report}
                meetings={meetings}
                onChanged={() => void load()}
              />
            ))}
          </ul>
        )}
      </StudioPanel>
    </>
  );
}
