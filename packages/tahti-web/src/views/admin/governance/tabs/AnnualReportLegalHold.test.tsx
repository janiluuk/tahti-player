import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as reports from '../../../../api/admin/admin-annual-reports';
import { draftReport } from '../../../../test/annualReports';
import { AnnualReportLegalHold } from './AnnualReportLegalHold';

describe('AnnualReportLegalHold', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('holds a report with a reason', async () => {
    const hold = vi
      .spyOn(reports, 'setAnnualReportLegalHold')
      .mockResolvedValue({ ok: true });
    const onChanged = vi.fn();
    render(
      <AnnualReportLegalHold report={draftReport} onChanged={onChanged} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Legal hold' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hold report' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Give the reason for the hold.',
    );
    fireEvent.change(screen.getByLabelText('Reason for the hold'), {
      target: { value: 'Auditor review' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Hold report' }));
    expect(hold).toHaveBeenCalledWith(2025, 'Auditor review');
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it('shows the reason and releases a hold', () => {
    const hold = vi
      .spyOn(reports, 'setAnnualReportLegalHold')
      .mockResolvedValue({ ok: true });
    render(
      <AnnualReportLegalHold
        report={{
          ...draftReport,
          legalHoldAt: '2026-06-01T00:00:00.000Z',
          legalHoldReason: 'Auditor review',
        }}
        onChanged={vi.fn()}
      />,
    );
    expect(screen.getByText('Held: Auditor review')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Release hold' }));
    expect(hold).toHaveBeenCalledWith(2025, null);
  });
});
