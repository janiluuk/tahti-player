// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import { renderWithRouter } from '../test/renderWithRouter';
import { TransparencyView } from './TransparencyView';

const meta = { source: 'api' as const };

describe('TransparencyView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows an error with Retry when every fetch fails', async () => {
    vi.spyOn(client, 'fetchTransparencyYtd').mockRejectedValue(new Error('x'));
    vi.spyOn(client, 'fetchTransparencyGrants').mockRejectedValue(
      new Error('x'),
    );
    const ledger = vi
      .spyOn(client, 'fetchTransparencyLedger')
      .mockRejectedValue(new Error('x'));
    await renderWithRouter(<TransparencyView />);
    expect(
      await screen.findByText('Could not load transparency data'),
    ).toBeTruthy();
    ledger.mockResolvedValue({ data: [], meta });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No ledger entries yet')).toBeTruthy();
  });

  it('keeps the sections that loaded when one fetch fails', async () => {
    vi.spyOn(client, 'fetchTransparencyYtd').mockRejectedValue(new Error('x'));
    vi.spyOn(client, 'fetchTransparencyGrants').mockRejectedValue(
      new Error('x'),
    );
    vi.spyOn(client, 'fetchTransparencyLedger').mockResolvedValue({
      data: [
        {
          id: 'l1',
          createdAt: '2026-10-01T00:00:00Z',
          category: 'HOSTING',
          description: 'Servers',
          amountCents: '1200',
        },
      ] as never,
      meta,
    });
    await renderWithRouter(<TransparencyView />);
    expect(await screen.findByText('Servers')).toBeTruthy();
    expect(screen.queryByText('Could not load transparency data')).toBeNull();
  });
});
