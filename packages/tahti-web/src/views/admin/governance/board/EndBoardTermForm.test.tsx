import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as board from '../../../../api/admin/admin-governance-board';
import { EndBoardTermForm } from './EndBoardTermForm';

const term = board.mockBoardTerms()[0]!;

describe('EndBoardTermForm', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ends a term on a day with a reason', async () => {
    const end = vi
      .spyOn(board, 'endAdminBoardTerm')
      .mockResolvedValue({ ok: true });
    const onEnded = vi.fn();
    render(<EndBoardTermForm term={term} onEnded={onEnded} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'End term early: Mart Saar' }),
    );
    fireEvent.change(screen.getByLabelText('Term ends on'), {
      target: { value: '2026-11-30' },
    });
    fireEvent.change(screen.getByLabelText('Why (optional)'), {
      target: { value: 'Resigned' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'End term' }));
    expect(end).toHaveBeenCalledWith(term.id, '2026-11-30', 'Resigned');
    await waitFor(() => expect(onEnded).toHaveBeenCalled());
  });

  it("shows the API's refusal to extend a term", async () => {
    vi.spyOn(board, 'endAdminBoardTerm').mockResolvedValue({
      ok: false,
      error: 'A term can be shortened, not extended',
    });
    render(<EndBoardTermForm term={term} onEnded={vi.fn()} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'End term early: Mart Saar' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'End term' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'shortened, not extended',
    );
  });
});
