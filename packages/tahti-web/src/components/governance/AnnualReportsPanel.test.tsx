import { render, screen } from '@testing-library/react';
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
      await screen.findByRole('link', { name: 'Annual report 2025' }),
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
});
