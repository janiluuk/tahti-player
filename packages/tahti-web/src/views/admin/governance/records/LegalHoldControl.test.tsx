import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as holds from '../../../../api/admin/admin-governance-holds';
import { LegalHoldControl } from './LegalHoldControl';

describe('LegalHoldControl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('holds a record with a reason, then releases it', async () => {
    const hold = vi
      .spyOn(holds, 'setRecordLegalHold')
      .mockResolvedValue({ ok: true });
    render(<LegalHoldControl kind="meeting" id="m1" title="AGM 2026" />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Legal hold: AGM 2026' }),
    );
    fireEvent.change(screen.getByLabelText('Reason for the hold'), {
      target: { value: 'Disputed minutes' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Hold' }));
    expect(hold).toHaveBeenCalledWith('meeting', 'm1', 'Disputed minutes');
    expect(await screen.findByText('On legal hold')).toBeInTheDocument();
    expect(screen.getByText('Disputed minutes')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Release hold: AGM 2026' }),
    );
    expect(hold).toHaveBeenLastCalledWith('meeting', 'm1', null);
    expect(
      await screen.findByRole('button', { name: 'Legal hold: AGM 2026' }),
    ).toBeInTheDocument();
  });

  it("shows the API's refusal and keeps the hold", async () => {
    vi.spyOn(holds, 'setRecordLegalHold').mockResolvedValue({
      ok: false,
      error: 'Meeting not found',
    });
    render(
      <LegalHoldControl
        kind="meeting"
        id="m1"
        title="AGM 2026"
        legalHoldAt="2026-09-20T00:00:00.000Z"
        legalHoldReason="Disputed minutes"
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Release hold: AGM 2026' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Meeting not found',
    );
    expect(screen.getByText('On legal hold')).toBeInTheDocument();
  });
});
