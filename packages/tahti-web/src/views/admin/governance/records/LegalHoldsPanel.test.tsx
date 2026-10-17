import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as holds from '../../../../api/admin/admin-governance-legal-holds';
import { LegalHoldsPanel } from './LegalHoldsPanel';

describe('LegalHoldsPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists held records of every kind with the reason', async () => {
    vi.spyOn(holds, 'fetchGovernanceLegalHolds').mockResolvedValue({
      data: [
        {
          kind: 'ANNUAL_REPORT',
          id: '2025',
          title: 'Annual report 2025',
          legalHoldAt: '2026-06-01T00:00:00.000Z',
          legalHoldReason: 'Auditor review',
        },
        {
          kind: 'DOCUMENT',
          id: 'd1',
          title: 'Rules (v2)',
          legalHoldAt: '2026-05-01T00:00:00.000Z',
          legalHoldReason: null,
        },
      ],
      meta: { source: 'api' },
    });
    render(<LegalHoldsPanel />);
    expect(await screen.findByText('Annual report 2025')).toBeInTheDocument();
    expect(screen.getByText('Annual report')).toBeInTheDocument();
    expect(screen.getByText('Document')).toBeInTheDocument();
    expect(screen.getByText(/· Auditor review/)).toBeInTheDocument();
  });

  it('says when nothing is held', async () => {
    vi.spyOn(holds, 'fetchGovernanceLegalHolds').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    render(<LegalHoldsPanel />);
    expect(
      await screen.findByText('Nothing is on legal hold'),
    ).toBeInTheDocument();
  });
});
