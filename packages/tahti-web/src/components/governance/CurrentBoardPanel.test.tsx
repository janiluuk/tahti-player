import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as board from '../../api/governance-board';
import { CurrentBoardPanel } from './CurrentBoardPanel';

describe('CurrentBoardPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists each seat with its role and term', async () => {
    vi.spyOn(board, 'fetchCurrentBoard').mockResolvedValue({
      data: board.mockCurrentBoard(),
      meta: { source: 'api' },
    });
    render(<CurrentBoardPanel />);
    expect(await screen.findByText('Mart Saar')).toBeInTheDocument();
    expect(screen.getByText('@mart-saar')).toBeInTheDocument();
    expect(screen.getByText(/^Chair · since/)).toBeInTheDocument();
    expect(screen.getByText(/^Treasurer · since/)).toBeInTheDocument();
    expect(
      screen.getByText(/^Deputy member · since .*, until/),
    ).toBeInTheDocument();
  });

  it('says when no terms are recorded', async () => {
    vi.spyOn(board, 'fetchCurrentBoard').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    render(<CurrentBoardPanel />);
    expect(
      await screen.findByText('No board terms are recorded yet.'),
    ).toBeInTheDocument();
  });

  it('says when the board could not be loaded', async () => {
    vi.spyOn(board, 'fetchCurrentBoard').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'Members only' },
    });
    render(<CurrentBoardPanel />);
    expect(
      await screen.findByText('Could not load the board. Try again later.'),
    ).toBeInTheDocument();
  });
});
