import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as elections from '../../../../api/admin/admin-governance-elections';
import { ElectionActions } from './ElectionActions';

const open = elections.mockAdminElections()[0]!;

describe('ElectionActions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saves a changed election', async () => {
    const update = vi
      .spyOn(elections, 'updateAdminElection')
      .mockResolvedValue({ ok: true });
    const onChanged = vi.fn();
    render(<ElectionActions election={open} onChanged={onChanged} />);
    fireEvent.click(
      screen.getByRole('button', { name: `Edit election: ${open.title}` }),
    );
    fireEvent.change(screen.getByLabelText('Seats'), {
      target: { value: '5' },
    });
    fireEvent.change(screen.getByLabelText('Nominations close'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save election' }));
    expect(update).toHaveBeenCalledWith(open.id, {
      title: open.title,
      seats: 5,
      nominationsCloseAt: null,
    });
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it('cancels with a reason', async () => {
    const cancel = vi
      .spyOn(elections, 'cancelAdminElection')
      .mockResolvedValue({ ok: true });
    render(<ElectionActions election={open} onChanged={vi.fn()} />);
    fireEvent.click(
      screen.getByRole('button', { name: `Cancel election: ${open.title}` }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Cancel the election' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('give the reason');
    fireEvent.change(screen.getByLabelText('Why is it cancelled?'), {
      target: { value: 'Moved to the spring meeting' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Cancel the election' }),
    );
    expect(cancel).toHaveBeenCalledWith(open.id, 'Moved to the spring meeting');
  });

  it('offers nothing once decided or cancelled', () => {
    const { container } = render(
      <ElectionActions
        election={{ ...open, decidedAt: '2026-12-01T00:00:00.000Z' }}
        onChanged={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
