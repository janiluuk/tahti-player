import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as elections from '../../../../api/admin/admin-governance-elections';
import { ElectionsAdminPanel } from './ElectionsAdminPanel';

const open = elections.mockAdminElections()[0]!;

describe('ElectionsAdminPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists elections with their stage', async () => {
    vi.spyOn(elections, 'fetchAdminElections').mockResolvedValue({
      data: [
        open,
        {
          ...open,
          id: 'cancelled',
          title: 'Secretary 2026',
          cancelledAt: '2026-01-01T00:00:00.000Z',
          cancelReason: 'No candidates',
        },
      ],
      meta: { source: 'api' },
    });
    render(<ElectionsAdminPanel />);
    expect(
      await screen.findByText('Board members for 2027'),
    ).toBeInTheDocument();
    expect(screen.getByText('Nominations open')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText(/· No candidates/)).toBeInTheDocument();
  });

  it('calls an election and reloads', async () => {
    const fetchAll = vi
      .spyOn(elections, 'fetchAdminElections')
      .mockResolvedValue({ data: [], meta: { source: 'api' } });
    const create = vi
      .spyOn(elections, 'createAdminElection')
      .mockResolvedValue({ ok: true });
    render(<ElectionsAdminPanel />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Call an election' }),
    );
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Board 2028' },
    });
    fireEvent.change(screen.getByLabelText('Seats'), {
      target: { value: '4' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Call election' }));
    expect(create).toHaveBeenCalledWith({
      title: 'Board 2028',
      role: 'MEMBER',
      seats: 4,
    });
    await waitFor(() => expect(fetchAll).toHaveBeenCalledTimes(2));
  });

  it('checks the seats before calling', async () => {
    vi.spyOn(elections, 'fetchAdminElections').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    const create = vi.spyOn(elections, 'createAdminElection');
    render(<ElectionsAdminPanel />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Call an election' }),
    );
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Board 2028' },
    });
    fireEvent.change(screen.getByLabelText('Seats'), {
      target: { value: '0' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Call election' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Seats must be a whole number from 1 to 20.',
    );
    expect(create).not.toHaveBeenCalled();
  });
});
