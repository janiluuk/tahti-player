// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as membership from '../api/membership';
import { MembershipInvoices } from './MembershipInvoices';

describe('formatInvoiceAmount', () => {
  it('formats in the invoice currency', () => {
    expect(
      membership.formatInvoiceAmount(4000, 'eur').replace(/\s/g, ' '),
    ).toBe('40,00 €');
  });
});

describe('MembershipInvoices', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists invoices with status, PDF and a pay link for unpaid ones', async () => {
    vi.spyOn(membership, 'fetchMembershipInvoices').mockResolvedValue({
      ok: true,
      invoices: [
        {
          id: 'in_1',
          number: 'TAHTI-0042',
          status: 'paid',
          amountPaidCents: 4000,
          currency: 'eur',
          created: '2026-01-02T10:00:00.000Z',
          hostedInvoiceUrl: 'https://invoice.stripe.com/i/1',
          invoicePdf: 'https://pay.stripe.com/invoice/1/pdf',
        },
        {
          id: 'in_2',
          number: null,
          status: 'open',
          amountPaidCents: 0,
          currency: 'eur',
          created: '2027-01-02T10:00:00.000Z',
          hostedInvoiceUrl: 'https://invoice.stripe.com/i/2',
          invoicePdf: null,
        },
      ],
    });
    await act(async () => {
      render(<MembershipInvoices />);
    });
    expect(screen.getByText('Paid')).toBeTruthy();
    expect(screen.getByText('Unpaid')).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'Download invoice TAHTI-0042 as PDF' })
        .getAttribute('href'),
    ).toBe('https://pay.stripe.com/invoice/1/pdf');
    expect(screen.getByRole('link', { name: 'Pay' }).getAttribute('href')).toBe(
      'https://invoice.stripe.com/i/2',
    );
  });

  it('explains an empty list and shows a load error', async () => {
    const fetchSpy = vi
      .spyOn(membership, 'fetchMembershipInvoices')
      .mockResolvedValueOnce({ ok: true, invoices: [] });
    await act(async () => {
      render(<MembershipInvoices />);
    });
    expect(screen.getByText(/No membership invoices yet/)).toBeTruthy();
    cleanup();

    fetchSpy.mockResolvedValueOnce({
      ok: false,
      error: 'Could not load invoices',
    });
    await act(async () => {
      render(<MembershipInvoices />);
    });
    expect(screen.getByRole('alert').textContent).toBe(
      'Could not load invoices',
    );
  });
});
