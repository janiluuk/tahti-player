import { FileTextIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button, InlineError, Input, Loader } from '@tahti-player/ui';

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
          <div className="w-28">
            <Input
              label="Year"
              value={year}
              onChange={(event) => setYear(event.target.value)}
              inputMode="numeric"
            />
          </div>
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
              <Loader size="inline" shape="circle" className="mr-1.5" />
            ) : (
              <FileTextIcon size={14} aria-hidden className="mr-1.5" />
            )}
            {busy ? 'Generating…' : 'Generate report'}
          </Button>
        </div>
        {error ? <InlineError className="mt-2">{error}</InlineError> : null}
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
