import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as reports from '../../../../api/admin/admin-annual-reports';
import { draftReport } from '../../../../test/annualReports';
import { AnnualReportActions } from './AnnualReportActions';

describe('AnnualReportActions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('records the approval of a draft', async () => {
    const approve = vi
      .spyOn(reports, 'approveAnnualReport')
      .mockResolvedValue({ ok: true });
    const onChanged = vi.fn();
    render(
      <AnnualReportActions
        report={draftReport}
        meetings={[]}
        onChanged={onChanged}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Approve report 2025' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Record approval' }));
    expect(approve).toHaveBeenCalledWith(2025, undefined);
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("shows the API's refusal", async () => {
    vi.spyOn(reports, 'approveAnnualReport').mockResolvedValue({
      ok: false,
      error: 'This report is already approved',
    });
    render(
      <AnnualReportActions
        report={draftReport}
        meetings={[]}
        onChanged={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Approve report 2025' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Record approval' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'already approved',
    );
  });

  it('offers no approval once approved', () => {
    render(
      <AnnualReportActions
        report={{ ...draftReport, approvedAt: '2026-04-01T00:00:00.000Z' }}
        meetings={[]}
        onChanged={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Approve report 2025' }),
    ).toBeNull();
  });

  it('publishes an approved report after confirming', async () => {
    const publish = vi
      .spyOn(reports, 'publishAnnualReport')
      .mockResolvedValue({ ok: true });
    const onChanged = vi.fn();
    render(
      <AnnualReportActions
        report={{ ...draftReport, approvedAt: '2026-04-01T00:00:00.000Z' }}
        meetings={[]}
        onChanged={onChanged}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Publish to members' }));
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect(publish).toHaveBeenCalledWith(2025);
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it('offers no publish for a draft or a published report', () => {
    const { rerender } = render(
      <AnnualReportActions
        report={draftReport}
        meetings={[]}
        onChanged={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Publish to members' }),
    ).toBeNull();
    rerender(
      <AnnualReportActions
        report={{
          ...draftReport,
          approvedAt: '2026-04-01T00:00:00.000Z',
          publishedAt: '2026-04-02T00:00:00.000Z',
        }}
        meetings={[]}
        onChanged={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Publish to members' }),
    ).toBeNull();
  });
});
