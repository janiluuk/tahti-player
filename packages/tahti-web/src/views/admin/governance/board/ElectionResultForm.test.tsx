import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as elections from '../../../../api/admin/admin-governance-elections';
import { ElectionResultForm } from './ElectionResultForm';

const open = { ...elections.mockAdminElections()[0]!, seats: 1 };
const candidate = (
  id: string,
  displayName: string,
  withdrawnAt: string | null = null,
): elections.AdminElectionCandidate => ({
  id: `cand-${id}`,
  userId: id,
  displayName,
  statement: null,
  selfNominated: true,
  withdrawnAt,
  elected: false,
  createdAt: '2026-10-02T00:00:00.000Z',
});

describe('ElectionResultForm', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('records who was elected', async () => {
    const record = vi
      .spyOn(elections, 'recordElectionResult')
      .mockResolvedValue({ ok: true });
    const onRecorded = vi.fn();
    render(
      <ElectionResultForm
        election={open}
        candidates={[
          candidate('u2', 'Liis Kask'),
          candidate('u3', 'Pekka Laine', '2026-10-05T00:00:00.000Z'),
        ]}
        onRecorded={onRecorded}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Record the result' }));
    expect(
      screen.queryByRole('switch', { name: 'Elected: Pekka Laine' }),
    ).toBeNull();
    fireEvent.click(screen.getByRole('switch', { name: 'Elected: Liis Kask' }));
    fireEvent.change(screen.getByLabelText('Terms start'), {
      target: { value: '2027-01-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Record result' }));
    expect(record).toHaveBeenCalledWith(open.id, {
      electedUserIds: ['u2'],
      termStart: '2027-01-01',
    });
    await waitFor(() => expect(onRecorded).toHaveBeenCalled());
  });

  it('refuses more elected members than seats', () => {
    const record = vi.spyOn(elections, 'recordElectionResult');
    render(
      <ElectionResultForm
        election={open}
        candidates={[candidate('u2', 'Liis Kask'), candidate('u3', 'Anna')]}
        onRecorded={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Record the result' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Elected: Liis Kask' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Elected: Anna' }));
    fireEvent.click(screen.getByRole('button', { name: 'Record result' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Only one seat is open.',
    );
    expect(record).not.toHaveBeenCalled();
  });

  it('offers nothing without standing candidates or once decided', () => {
    const { container, rerender } = render(
      <ElectionResultForm
        election={open}
        candidates={[]}
        onRecorded={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
    rerender(
      <ElectionResultForm
        election={{ ...open, decidedAt: '2026-12-01T00:00:00.000Z' }}
        candidates={[candidate('u2', 'Liis Kask')]}
        onRecorded={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
