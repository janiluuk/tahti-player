import { FileTextIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
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
import { apiResult, useSnapshotFetch } from '../../../../lib/useSnapshotFetch';
import { AnnualReportRow } from './AnnualReportRow';

export function ReportsTab() {
  const { t } = useTranslation('web');
  const [year, setYear] = useState(String(new Date().getUTCFullYear() - 1));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<GovernanceMeeting[]>([]);

  const snapshot = useSnapshotFetch<AdminAnnualReport[]>(
    'admin-annual-reports',
    async () => apiResult(await fetchAdminAnnualReports()),
  );
  const reports = snapshot.data ?? [];
  const { loading, retry: load } = snapshot;

  useEffect(() => {
    void fetchAdminGovernanceMeetings().then((result) =>
      setMeetings(result.data),
    );
  }, []);

  return (
    <>
      <StudioPanel title={t('reportsTab.generateReport')}>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setBusy(true);
            setError(null);
            void generateAdminAnnualReport(Number(year)).then((result) => {
              setBusy(false);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              load();
            });
          }}
        >
          <div className="w-28">
            <Input
              label={t('reportsTab.year')}
              value={year}
              onChange={(event) => setYear(event.target.value)}
              inputMode="numeric"
            />
          </div>
          <Button
            size="sm"
            disabled={busy || !/^20\d{2}$/.test(year)}
            type="submit"
          >
            {busy ? (
              <Loader size="inline" shape="circle" className="mr-1.5" />
            ) : (
              <FileTextIcon size={14} aria-hidden className="mr-1.5" />
            )}
            {busy ? 'Generating…' : 'Generate report'}
          </Button>
        </form>
        {error ? <InlineError className="mt-2">{error}</InlineError> : null}
      </StudioPanel>
      <StudioPanel title={t('reportsTab.generatedReports')}>
        {loading ? (
          <PageLoading label={t('loading.loadingReports')} />
        ) : reports.length === 0 ? (
          <PageEmpty title={t('empties.noAnnualReportsGeneratedYet')} />
        ) : (
          <ul className="divide-border divide-y">
            {reports.map((report) => (
              <AnnualReportRow
                key={report.id}
                report={report}
                meetings={meetings}
                onChanged={load}
              />
            ))}
          </ul>
        )}
      </StudioPanel>
    </>
  );
}
