import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as elections from '../../../../api/admin/admin-governance-elections';
import * as adminUsers from '../../../../api/admin/admin-users';
import { ElectionCandidates } from './ElectionCandidates';

const open = elections.mockAdminElections()[0]!;
const liis: elections.AdminElectionCandidate = {
  id: 'cand-liis',
  userId: 'u2',
  displayName: 'Liis Kask',
  statement: 'Open books.',
  selfNominated: true,
  withdrawnAt: null,
  elected: false,
  createdAt: '2026-10-02T00:00:00.000Z',
};

describe('ElectionCandidates', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists candidates, withdrawn ones marked', async () => {
    vi.spyOn(elections, 'fetchAdminElectionCandidates').mockResolvedValue({
      data: [
        liis,
        {
          ...liis,
          id: 'cand-2',
          userId: 'u3',
          displayName: 'Pekka Laine',
          statement: null,
          selfNominated: false,
          withdrawnAt: '2026-10-05T00:00:00.000Z',
        },
      ],
      meta: { source: 'api' },
    });
    render(<ElectionCandidates election={open} />);
    fireEvent.click(
      screen.getByRole('button', { name: `Candidates: ${open.title}` }),
    );
    expect(await screen.findByText('Liis Kask')).toBeInTheDocument();
    expect(screen.getByText('stood themselves')).toBeInTheDocument();
    expect(
      screen.getByText('nominated by the board · withdrew'),
    ).toBeInTheDocument();
  });

  it('nominates a member and reloads', async () => {
    const fetchCandidates = vi
      .spyOn(elections, 'fetchAdminElectionCandidates')
      .mockResolvedValue({ data: [], meta: { source: 'api' } });
    vi.spyOn(adminUsers, 'fetchAdminUsers').mockResolvedValue({
      data: [
        {
          id: 'u9',
          memberNumber: 9,
          displayName: 'Anna Virtanen',
          email: 'anna@example.com',
          username: 'anna',
          role: 'LISTENER',
          tier: 'FREE',
          isMember: true,
          isBoard: false,
          suspendedAt: null,
          channelState: null,
          engagementUnitsYtd: 0,
        },
      ],
      total: 1,
      meta: { source: 'api' },
    });
    const nominate = vi
      .spyOn(elections, 'nominateElectionCandidate')
      .mockResolvedValue({ ok: true });
    render(<ElectionCandidates election={open} />);
    fireEvent.click(
      screen.getByRole('button', { name: `Candidates: ${open.title}` }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Nominate a member' }),
    );
    fireEvent.change(screen.getByLabelText('Nominee'), {
      target: { value: 'anna' },
    });
    fireEvent.click(
      await screen.findByRole('button', { name: 'Anna Virtanen @anna' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Nominate' }));
    expect(nominate).toHaveBeenCalledWith(
      open.id,
      { userId: 'u9', displayName: 'Anna Virtanen' },
      '',
    );
    await waitFor(() => expect(fetchCandidates).toHaveBeenCalledTimes(2));
  });

  it('offers no nomination once the election is decided', async () => {
    vi.spyOn(elections, 'fetchAdminElectionCandidates').mockResolvedValue({
      data: [{ ...liis, elected: true }],
      meta: { source: 'api' },
    });
    render(
      <ElectionCandidates
        election={{ ...open, decidedAt: '2026-12-01T00:00:00.000Z' }}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: `Candidates: ${open.title}` }),
    );
    expect(await screen.findByText('Elected')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Nominate a member' }),
    ).toBeNull();
  });
});
