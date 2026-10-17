import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as elections from '../../api/governance-elections';
import { ElectionsPanel } from './ElectionsPanel';

const [open, decided] = elections.mockGovernanceElections();

describe('ElectionsPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists elections with their status and candidates', async () => {
    vi.spyOn(elections, 'fetchGovernanceElections').mockResolvedValue({
      data: [open!, decided!],
      meta: { source: 'api' },
    });
    render(<ElectionsPanel />);
    expect(
      await screen.findByText('Board members for 2027'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Board member · 3 seats · Nominations open until/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Chair · 1 seat · Decided/)).toBeInTheDocument();

    const chairCandidates = within(
      screen.getByRole('list', { name: 'Candidates in Chair for 2026' }),
    );
    expect(chairCandidates.getByText('Mart Saar')).toBeInTheDocument();
    expect(chairCandidates.getByText('Elected')).toBeInTheDocument();
    expect(
      screen.getByText('I want the grant round to open twice a year.'),
    ).toBeInTheDocument();
  });

  it('marks an election you stand in and says why one was cancelled', async () => {
    vi.spyOn(elections, 'fetchGovernanceElections').mockResolvedValue({
      data: [
        { ...open!, youAreCandidate: true, candidates: [] },
        {
          ...decided!,
          id: 'cancelled',
          title: 'Secretary',
          decidedAt: null,
          cancelledAt: '2026-01-01T00:00:00.000Z',
          cancelReason: 'No candidates',
        },
      ],
      meta: { source: 'api' },
    });
    render(<ElectionsPanel />);
    expect(await screen.findByText('You are standing')).toBeInTheDocument();
    expect(screen.getByText('No candidates yet.')).toBeInTheDocument();
    expect(screen.getByText(/Cancelled: No candidates/)).toBeInTheDocument();
  });

  it('says when no election has been called', async () => {
    vi.spyOn(elections, 'fetchGovernanceElections').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    render(<ElectionsPanel />);
    expect(
      await screen.findByText('No board elections have been called yet.'),
    ).toBeInTheDocument();
  });
});
