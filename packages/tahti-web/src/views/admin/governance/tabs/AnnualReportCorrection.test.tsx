import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as reports from '../../../../api/admin/admin-annual-reports';
import { draftReport } from '../../../../test/annualReports';
import { AnnualReportCorrection } from './AnnualReportCorrection';

const approved = { ...draftReport, approvedAt: '2026-04-01T00:00:00.000Z' };

describe('AnnualReportCorrection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('corrects an approved report with a note', async () => {
    const correct = vi
      .spyOn(reports, 'correctAnnualReport')
      .mockResolvedValue({ ok: true });
    const onChanged = vi.fn();
    render(<AnnualReportCorrection report={approved} onChanged={onChanged} />);
    fireEvent.click(screen.getByRole('button', { name: 'Correct report' }));
    fireEvent.change(
      screen.getByLabelText('What does the correction change?'),
      { target: { value: 'Grant total was missing December.' } },
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Regenerate corrected report' }),
    );
    expect(correct).toHaveBeenCalledWith(
      2025,
      'Grant total was missing December.',
    );
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it('lists the versions a correction replaced', async () => {
    vi.spyOn(reports, 'fetchAnnualReportRevisions').mockResolvedValue({
      data: [
        {
          id: 'rev1',
          generatedAt: '2026-04-01T00:00:00.000Z',
          replacedAt: '2026-05-01T00:00:00.000Z',
          note: 'Grant total was missing December.',
          downloadUrl: 'https://files.example/rev1.md',
        },
      ],
      meta: { source: 'api' },
    });
    render(
      <AnnualReportCorrection
        report={{ ...approved, correctedAt: '2026-05-01T00:00:00.000Z' }}
        onChanged={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Earlier versions' }));
    expect(
      await screen.findByText('Grant total was missing December.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Download (opens in a new tab)' }),
    ).toHaveAttribute('href', 'https://files.example/rev1.md');
  });

  it('offers no correction for a draft or a held report', () => {
    const { rerender } = render(
      <AnnualReportCorrection report={draftReport} onChanged={vi.fn()} />,
    );
    expect(screen.queryByRole('button')).toBeNull();
    rerender(
      <AnnualReportCorrection
        report={{ ...approved, legalHoldAt: '2026-06-01T00:00:00.000Z' }}
        onChanged={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Correct report' })).toBeNull();
  });
});
