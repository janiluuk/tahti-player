import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, InlineError, Input } from '@tahti-player/ui';

import {
  setAnnualReportFiling,
  type AdminAnnualReport,
} from '../../../../api/admin/admin-annual-reports';

/** When an approved report was filed with the register, and its reference. */
export function AnnualReportFilingForm({
  report,
  onChanged,
}: {
  report: AdminAnnualReport;
  onChanged: () => void;
}) {
  const { t } = useTranslation('web');
  const [open, setOpen] = useState(false);
  const [filedAt, setFiledAt] = useState(report.filedAt?.slice(0, 10) ?? '');
  const [reference, setReference] = useState(report.filingReference ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!report.approvedAt) {
    return null;
  }

  const save = (clear: boolean) => {
    if (!clear && !filedAt) {
      setError('Choose the day it was filed.');
      return;
    }
    setBusy(true);
    setError(null);
    void setAnnualReportFiling(
      report.year,
      clear
        ? { filedAt: null }
        : { filedAt, filingReference: reference.trim() || null },
    ).then((result) => {
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      onChanged();
    });
  };

  if (!open) {
    return (
      <Button
        size="sm"
        variant="secondary"
        className="w-fit"
        onClick={() => setOpen(true)}
      >
        {report.filedAt ? 'Change filing' : 'Record filing'}
      </Button>
    );
  }

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        save(false);
      }}
    >
      <Input
        label={t('annualReportFiling.filedWithTheRegisterOn')}
        type="date"
        value={filedAt}
        onChange={(e) => setFiledAt(e.target.value)}
      />
      <Input
        label={t('annualReportFiling.registerReferenceOptional')}
        value={reference}
        maxLength={100}
        onChange={(e) => setReference(e.target.value)}
      />
      <Button type="submit" size="sm" disabled={busy}>
        {t('annualReportFiling.saveFiling')}
      </Button>
      {report.filedAt ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => save(true)}
        >
          {t('annualReportFiling.clearFiling')}
        </Button>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={busy}
        onClick={() => setOpen(false)}
      >
        {t('annualReportFiling.cancel')}
      </Button>
      {error ? (
        <InlineError textSize="xs" className="w-full">
          {error}
        </InlineError>
      ) : null}
    </form>
  );
}
