import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as reports from '../../../../api/admin/admin-annual-reports';
import { ReportsTab } from './ReportsTab';

const draft: reports.AdminAnnualReport = {
  id: 'r2025',
  year: 2025,
  storageKey: 'reports/annual-2025.md',
  generatedAt: '2026-02-12T10:00:00.000Z',
  generatedByDisplayName: 'Rautatie',
  downloadUrl: null,
  approvedAt: null,
  approvalMeetingId: null,
  publishedAt: null,
  filedAt: null,
  filingReference: null,
  correctedAt: null,
  archivedAt: null,
  legalHoldAt: null,
  legalHoldReason: null,
};

describe('ReportsTab', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows where each report stands', async () => {
    vi.spyOn(reports, 'fetchAdminAnnualReports').mockResolvedValue({
      data: [
        draft,
        {
          ...draft,
          id: 'r2024',
          year: 2024,
          approvedAt: '2025-04-18T00:00:00.000Z',
          publishedAt: '2025-04-19T00:00:00.000Z',
          filedAt: '2025-05-02T00:00:00.000Z',
          filingReference: 'PRH-123',
          legalHoldAt: '2025-06-01T00:00:00.000Z',
        },
      ],
      meta: { source: 'api' },
    });
    render(<ReportsTab />);
    expect(await screen.findByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.getByText('On legal hold')).toBeInTheDocument();
    expect(screen.getByText(/filed .* \(PRH-123\)/)).toBeInTheDocument();
  });

  it('reloads the list after generating instead of inserting the answer', async () => {
    const fetchAll = vi
      .spyOn(reports, 'fetchAdminAnnualReports')
      .mockResolvedValueOnce({ data: [], meta: { source: 'api' } })
      .mockResolvedValueOnce({ data: [draft], meta: { source: 'api' } });
    vi.spyOn(reports, 'generateAdminAnnualReport').mockResolvedValue({
      ok: true,
    });
    render(<ReportsTab />);
    await screen.findByText('No annual reports generated yet');
    fireEvent.click(screen.getByRole('button', { name: 'Generate report' }));
    expect(await screen.findByText('Annual report 2025')).toBeInTheDocument();
    expect(screen.queryByText(/Invalid Date/)).toBeNull();
    await waitFor(() => expect(fetchAll).toHaveBeenCalledTimes(2));
  });

  it('shows why a report could not be generated', async () => {
    vi.spyOn(reports, 'fetchAdminAnnualReports').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    vi.spyOn(reports, 'generateAdminAnnualReport').mockResolvedValue({
      ok: false,
      error: 'An approved report is corrected, not regenerated',
    });
    render(<ReportsTab />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Generate report' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An approved report is corrected',
    );
  });
});
