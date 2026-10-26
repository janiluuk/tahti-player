import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as reports from '../../api/governance-annual-reports';
import { AnnualReportsPanel } from './AnnualReportsPanel';

describe('AnnualReportsPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('links each published report and says when it was filed or corrected', async () => {
    vi.spyOn(reports, 'fetchAnnualReports').mockResolvedValue({
      data: reports.mockAnnualReports(),
      meta: { source: 'api' },
    });
    render(<AnnualReportsPanel />);
    expect(
      await screen.findByRole('link', {
        name: 'Annual report 2025 (opens in a new tab)',
      }),
    ).toHaveAttribute('href', 'https://tahti.live/reports/annual-2025.md');
    expect(
      screen.getByText(/^Approved .* · filed with the register/),
    ).toBeInTheDocument();
    expect(screen.getByText('Annual report 2024')).not.toHaveAttribute('href');
    expect(screen.getByText(/· corrected/)).toBeInTheDocument();
  });

  it('says when nothing is published', async () => {
    vi.spyOn(reports, 'fetchAnnualReports').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    render(<AnnualReportsPanel />);
    expect(
      await screen.findByText('No annual report has been published yet.'),
    ).toBeInTheDocument();
  });

  it('says when the reports could not be loaded and can retry', async () => {
    const fetch = vi.spyOn(reports, 'fetchAnnualReports').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    render(<AnnualReportsPanel />);
    expect(
      await screen.findByText('Could not load the annual reports'),
    ).toBeInTheDocument();
    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(
      await screen.findByText('No annual report has been published yet.'),
    ).toBeInTheDocument();
  });
});
