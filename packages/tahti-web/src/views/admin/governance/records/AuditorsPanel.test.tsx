import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as auditors from '../../../../api/admin/admin-governance-auditors';
import { AuditorsPanel } from './AuditorsPanel';

describe('AuditorsPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists auditors with whether they serve', async () => {
    vi.spyOn(auditors, 'fetchAdminAuditors').mockResolvedValue({
      data: [
        ...auditors.mockAdminAuditors(),
        {
          id: 'aud-old',
          kind: 'AUDITOR',
          deputy: true,
          name: 'Old Auditor',
          firm: 'Tilit Oy',
          termStart: '2023-01-01T00:00:00.000Z',
          termEnd: '2024-01-01T00:00:00.000Z',
          meetingId: null,
        },
      ],
      meta: { source: 'api' },
    });
    render(<AuditorsPanel />);
    expect(await screen.findByText('Anna Virtanen')).toBeInTheDocument();
    expect(screen.getByText('Serving')).toBeInTheDocument();
    expect(screen.getByText('Old Auditor, Tilit Oy')).toBeInTheDocument();
    expect(screen.getByText('Deputy auditor')).toBeInTheDocument();
    expect(screen.getByText('Not serving')).toBeInTheDocument();
  });

  it('adds a deputy inspector', async () => {
    const fetchAll = vi
      .spyOn(auditors, 'fetchAdminAuditors')
      .mockResolvedValue({ data: [], meta: { source: 'api' } });
    const create = vi
      .spyOn(auditors, 'createAdminAuditor')
      .mockResolvedValue({ ok: true });
    render(<AuditorsPanel />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Add an auditor' }),
    );
    fireEvent.click(screen.getByRole('switch', { name: 'Deputy' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Pekka Laine' },
    });
    fireEvent.change(screen.getByLabelText('Term starts'), {
      target: { value: '2027-01-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save auditor' }));
    expect(create).toHaveBeenCalledWith({
      kind: 'OPERATIONS_INSPECTOR',
      deputy: true,
      name: 'Pekka Laine',
      firm: '',
      termStart: '2027-01-01',
    });
    await waitFor(() => expect(fetchAll).toHaveBeenCalledTimes(2));
  });
});
