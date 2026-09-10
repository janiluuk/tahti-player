import { useEffect, useState } from 'react';

import { Button, Input } from '@tahti-player/ui';

import {
  fetchAdminAnnualReports,
  generateAdminAnnualReport,
  type AdminAnnualReport,
} from '../../../../api/admin';
import { PageEmpty, PageLoading } from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';

export function ReportsTab() {
  const [reports, setReports] = useState<AdminAnnualReport[]>([]);
  const [year, setYear] = useState(String(new Date().getUTCFullYear() - 1));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchAdminAnnualReports().then((result) => {
      setReports(result.data);
      setLoading(false);
    });
  }, []);

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
              void generateAdminAnnualReport(Number(year)).then((result) => {
                setBusy(false);
                if (result.data) {
                  setReports((current) => [
                    result.data!,
                    ...current.filter(
                      (item) => item.year !== result.data!.year,
                    ),
                  ]);
                }
              });
            }}
          >
            {busy ? 'Generating…' : 'Generate report'}
          </Button>
        </div>
      </StudioPanel>
      <StudioPanel title="Generated reports">
        {loading ? (
          <PageLoading label="Loading reports…" />
        ) : reports.length === 0 ? (
          <PageEmpty title="No annual reports generated yet" />
        ) : (
          <ul className="divide-border divide-y">
            {reports.map((report) => (
              <li
                key={report.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
              >
                <span>
                  <span className="font-medium">
                    Annual report {report.year}
                  </span>
                  <span className="text-foreground-secondary ml-2 text-xs">
                    {new Date(report.generatedAt).toLocaleDateString()}
                  </span>
                </span>
                {report.downloadUrl && (
                  <a
                    href={report.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs underline-offset-2 hover:underline"
                  >
                    Download
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </StudioPanel>
    </>
  );
}
