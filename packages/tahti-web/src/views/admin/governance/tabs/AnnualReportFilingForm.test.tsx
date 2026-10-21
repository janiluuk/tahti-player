import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as reports from '../../../../api/admin/admin-annual-reports';
import { draftReport } from '../../../../test/annualReports';
import { AnnualReportFilingForm } from './AnnualReportFilingForm';

const approved = { ...draftReport, approvedAt: '2026-04-01T00:00:00.000Z' };

describe('AnnualReportFilingForm', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('records the filing day and reference', async () => {
    const save = vi
      .spyOn(reports, 'setAnnualReportFiling')
      .mockResolvedValue({ ok: true });
    const onChanged = vi.fn();
    render(<AnnualReportFilingForm report={approved} onChanged={onChanged} />);
    fireEvent.click(screen.getByRole('button', { name: 'Record filing' }));
    fireEvent.change(screen.getByLabelText('Filed with the register on'), {
      target: { value: '2026-05-02' },
    });
    fireEvent.change(screen.getByLabelText('Register reference (optional)'), {
      target: { value: ' PRH-123 ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save filing' }));
    expect(save).toHaveBeenCalledWith(2025, {
      filedAt: '2026-05-02',
      filingReference: 'PRH-123',
    });
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it('clears a recorded filing', () => {
    const save = vi
      .spyOn(reports, 'setAnnualReportFiling')
      .mockResolvedValue({ ok: true });
    render(
      <AnnualReportFilingForm
        report={{ ...approved, filedAt: '2026-05-02T00:00:00.000Z' }}
        onChanged={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Change filing' }));
    expect(screen.getByLabelText('Filed with the register on')).toHaveValue(
      '2026-05-02',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear filing' }));
    expect(save).toHaveBeenCalledWith(2025, { filedAt: null });
  });

  it('asks for a day and shows nothing for a draft', () => {
    const { rerender } = render(
      <AnnualReportFilingForm report={approved} onChanged={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Record filing' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save filing' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose the day it was filed.',
    );
    rerender(
      <AnnualReportFilingForm report={draftReport} onChanged={vi.fn()} />,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });
});
