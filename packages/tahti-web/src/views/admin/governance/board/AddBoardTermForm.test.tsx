import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as board from '../../../../api/admin/admin-governance-board';
import * as adminUsers from '../../../../api/admin/admin-users';
import { AddBoardTermForm } from './AddBoardTermForm';

const member: adminUsers.AdminUserRow = {
  id: 'u7',
  memberNumber: 7,
  displayName: 'Liis Kask',
  email: 'liis@example.com',
  username: 'liis-kask',
  role: 'ARTIST',
  tier: 'ARTIST',
  isMember: true,
  isBoard: false,
  suspendedAt: null,
  channelState: null,
  engagementUnitsYtd: 0,
};

describe('AddBoardTermForm', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('finds a member and records their term', async () => {
    const search = vi
      .spyOn(adminUsers, 'fetchAdminUsers')
      .mockResolvedValue({ data: [member], total: 1, meta: { source: 'api' } });
    const create = vi
      .spyOn(board, 'createAdminBoardTerm')
      .mockResolvedValue({ ok: true });
    const onAdded = vi.fn();
    render(<AddBoardTermForm onAdded={onAdded} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add a board term' }));
    fireEvent.change(screen.getByLabelText('Member'), {
      target: { value: 'liis' },
    });
    fireEvent.click(
      await screen.findByRole('button', { name: 'Liis Kask @liis-kask' }),
    );
    expect(search).toHaveBeenCalledWith({ q: 'liis', isMember: 'true' });
    expect(screen.queryByText('liis@example.com')).toBeNull();
    fireEvent.change(screen.getByLabelText('Term starts'), {
      target: { value: '2027-01-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save term' }));
    expect(create).toHaveBeenCalledWith({
      userId: 'u7',
      displayName: 'Liis Kask',
      role: 'MEMBER',
      termStart: '2027-01-01',
    });
    await waitFor(() => expect(onAdded).toHaveBeenCalled());
  });

  it('asks for the member and start day first', () => {
    const create = vi.spyOn(board, 'createAdminBoardTerm');
    render(<AddBoardTermForm onAdded={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add a board term' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save term' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose the member and the day the term starts.',
    );
    expect(create).not.toHaveBeenCalled();
  });
});
