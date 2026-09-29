import { DownloadIcon, ExternalLinkIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge, ButtonAnchor } from '@tahti-player/ui';

import {
  fetchMembershipInvoices,
  formatInvoiceAmount,
  type MembershipInvoice,
} from '../api/membership';

const STATUS_LABELS: Record<
  string,
  { label: string; color: 'green' | 'yellow' | 'red' | 'secondary' }
> = {
  paid: { label: 'Paid', color: 'green' },
  open: { label: 'Unpaid', color: 'yellow' },
  uncollectible: { label: 'Uncollectible', color: 'red' },
  void: { label: 'Void', color: 'secondary' },
  draft: { label: 'Draft', color: 'secondary' },
};

export function MembershipInvoices() {
  const [invoices, setInvoices] = useState<MembershipInvoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchMembershipInvoices().then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setInvoices(result.invoices);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section aria-labelledby="membership-invoices-title">
      <h3
        id="membership-invoices-title"
        className="font-display text-base font-bold"
      >
        Invoices
      </h3>
      {error ? (
        <p className="text-accent-red-strong mt-2 text-sm" role="alert">
          {error}
        </p>
      ) : invoices === null ? (
        <p className="text-foreground-secondary mt-2 text-sm">Loading…</p>
      ) : invoices.length === 0 ? (
        <p className="text-foreground-secondary mt-2 text-sm">
          No membership invoices yet. Invoices appear here once you pay through
          Stripe checkout.
        </p>
      ) : (
        <ul className="divide-border mt-2 divide-y">
          {invoices.map((invoice) => {
            const status = invoice.status
              ? (STATUS_LABELS[invoice.status] ?? {
                  label: invoice.status,
                  color: 'secondary' as const,
                })
              : null;
            return (
              <li
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium">
                    {formatInvoiceAmount(
                      invoice.amountPaidCents,
                      invoice.currency,
                    )}
                    {invoice.number ? (
                      <span className="text-foreground-secondary font-normal">
                        {' '}
                        · {invoice.number}
                      </span>
                    ) : null}
                  </div>
                  <time
                    dateTime={invoice.created}
                    className="text-foreground-secondary text-xs"
                  >
                    {new Date(invoice.created).toLocaleDateString()}
                  </time>
                </div>
                <div className="flex items-center gap-1.5">
                  {status ? (
                    <Badge variant="pill" color={status.color}>
                      {status.label}
                    </Badge>
                  ) : null}
                  {invoice.invoicePdf ? (
                    <ButtonAnchor
                      href={invoice.invoicePdf}
                      target="_blank"
                      rel="noreferrer"
                      size="sm"
                      variant="text"
                      aria-label={
                        invoice.number
                          ? `Download invoice ${invoice.number} as PDF`
                          : 'Download invoice as PDF'
                      }
                    >
                      <DownloadIcon size={14} aria-hidden className="mr-1.5" />
                      PDF
                    </ButtonAnchor>
                  ) : null}
                  {invoice.hostedInvoiceUrl ? (
                    <ButtonAnchor
                      href={invoice.hostedInvoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                      size="sm"
                      variant="text"
                    >
                      <ExternalLinkIcon
                        size={14}
                        aria-hidden
                        className="mr-1.5"
                      />
                      {invoice.status === 'open' ? 'Pay' : 'View'}
                    </ButtonAnchor>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
