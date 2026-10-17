import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as queue from '../../../../api/admin/admin-governance-corrections';
import { CorrectionsQueuePanel } from './CorrectionsQueuePanel';

const waiting = queue.mockCorrectionQueue()[0]!;

describe('CorrectionsQueuePanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows waiting requests with who asked', async () => {
    const fetchQueue = vi
      .spyOn(queue, 'fetchAdminCorrections')
      .mockResolvedValue({ data: [waiting], meta: { source: 'api' } });
    render(<CorrectionsQueuePanel />);
    expect(
      await screen.findByText('My home municipality is Espoo, not Helsinki.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Liis Kask @liis-kask · member #12/),
    ).toBeInTheDocument();
    expect(screen.getByText('Member register details')).toBeInTheDocument();
    expect(fetchQueue).toHaveBeenCalledWith('OPEN');
  });

  it('switches to every request', async () => {
    const fetchQueue = vi
      .spyOn(queue, 'fetchAdminCorrections')
      .mockResolvedValue({ data: [], meta: { source: 'api' } });
    render(<CorrectionsQueuePanel />);
    expect(
      await screen.findByText('No requests are waiting'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'All' }));
    await waitFor(() => expect(fetchQueue).toHaveBeenLastCalledWith(undefined));
    expect(
      await screen.findByText('No correction requests yet'),
    ).toBeInTheDocument();
  });
});
