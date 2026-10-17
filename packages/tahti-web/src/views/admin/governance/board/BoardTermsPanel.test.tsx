import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as board from '../../../../api/admin/admin-governance-board';
import { BoardTermsPanel } from './BoardTermsPanel';

describe('BoardTermsPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists serving terms before ended ones with why they ended', async () => {
    vi.spyOn(board, 'fetchAdminBoardTerms').mockResolvedValue({
      data: [...board.mockBoardTerms()].reverse(),
      meta: { source: 'api' },
    });
    render(<BoardTermsPanel />);
    const names = await screen.findAllByText(/Mart Saar|Former Member/);
    expect(names.map((n) => n.textContent)).toEqual([
      'Mart Saar',
      'Former Member',
    ]);
    expect(screen.getByText('Serving')).toBeInTheDocument();
    expect(screen.getByText('Ended')).toBeInTheDocument();
    expect(screen.getByText(/· Resigned/)).toBeInTheDocument();
    expect(screen.getByText('Chair')).toBeInTheDocument();
  });

  it('says when no term is recorded', async () => {
    vi.spyOn(board, 'fetchAdminBoardTerms').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    render(<BoardTermsPanel />);
    expect(
      await screen.findByText('No board terms recorded yet'),
    ).toBeInTheDocument();
  });
});
