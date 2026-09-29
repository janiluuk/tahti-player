// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../../api/admin';
import { LedgerPanel } from './LedgerPanel';

const ENTRIES: admin.AdminLedgerEntry[] = [
  {
    id: '1',
    category: 'REVENUE_DONATION',
    amountCents: 12000,
    description: 'Member donation drive',
    createdAt: '2026-07-28T09:00:00.000Z',
  },
  {
    id: '2',
    category: 'COST_INFRASTRUCTURE',
    amountCents: 21500,
    description: 'UpCloud',
    externalRef: 'INV-42',
    createdAt: '2026-08-01T09:00:00.000Z',
  },
];

describe('validateLedgerEntry', () => {
  const entry = {
    category: 'COST_AUDIT',
    amountCents: 5000,
    description: 'Audit',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
  };

  it('accepts a positive amount with a period', () => {
    expect(admin.validateLedgerEntry(entry)).toBeNull();
  });

  it('refuses a negative or fractional amount, and a period ending before it starts', () => {
    expect(admin.validateLedgerEntry({ ...entry, amountCents: -5000 })).toMatch(
      /positive/,
    );
    expect(admin.validateLedgerEntry({ ...entry, amountCents: 0.5 })).toMatch(
      /positive/,
    );
    expect(
      admin.validateLedgerEntry({ ...entry, periodEnd: '2026-08-31' }),
    ).toMatch(/on or after/);
  });
});

describe('ledger years and export', () => {
  it('offers this year and the five before it, newest first', () => {
    expect(admin.ledgerYears(new Date('2026-09-29T00:00:00Z'))).toEqual([
      2026, 2025, 2024, 2023, 2022, 2021,
    ]);
  });

  it('points the export at the chosen year', () => {
    expect(admin.adminLedgerExportCsvUrl(2025)).toBe(
      '/tahti-api/api/admin/ledger/export.csv?year=2025',
    );
  });
});

describe('LedgerPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('signs entries by category: costs out, income in', () => {
    render(
      <LedgerPanel
        entries={ENTRIES}
        year={2026}
        onYearChange={vi.fn()}
        onChanged={vi.fn()}
      />,
    );
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]!.textContent).toContain('+€120,00');
    expect(rows[1]!.textContent).toContain('−€215,00');
    expect(rows[1]!.textContent).toContain('INV-42');
    expect(
      screen.getByRole('link', { name: 'Export CSV' }).getAttribute('href'),
    ).toBe('/tahti-api/api/admin/ledger/export.csv?year=2026');
  });

  it('sends the period and a positive amount, and shows a refusal', async () => {
    const create = vi
      .spyOn(admin, 'createLedgerEntry')
      .mockResolvedValueOnce({ ok: false, error: 'Nope' })
      .mockResolvedValueOnce({ ok: true });
    const onChanged = vi.fn();
    render(
      <LedgerPanel
        entries={[]}
        year={2026}
        onYearChange={vi.fn()}
        onChanged={onChanged}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add entry' }));
    fireEvent.change(screen.getByLabelText('Amount (€)'), {
      target: { value: '12,50' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Donation' },
    });
    fireEvent.change(screen.getByLabelText('Period start'), {
      target: { value: '2026-09-01' },
    });
    fireEvent.change(screen.getByLabelText('Period end'), {
      target: { value: '2026-09-30' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save entry' }));
    });
    expect(create).toHaveBeenLastCalledWith({
      category: 'REVENUE_SUBSCRIPTION',
      amountCents: 1250,
      description: 'Donation',
      externalRef: '',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
    });
    expect(screen.getByRole('alert').textContent).toBe('Nope');
    expect(onChanged).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save entry' }));
    });
    expect(onChanged).toHaveBeenCalled();
  });
});
