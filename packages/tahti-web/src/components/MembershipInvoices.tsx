import { DownloadIcon, ExternalLinkIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import {
  Badge,
  ButtonAnchor,
  InlineError,
  InlineLoader,
} from '@tahti-player/ui';

import {
  fetchMembershipInvoices,
  formatInvoiceAmount,
  type MembershipInvoice,
} from '../api/membership';
import { ListingDate } from './ListingDate';
import { PageEmpty } from './PageStates';

function statusLabels(
  t: TFunction<'web'>,
): Record<
  string,
  { label: string; color: 'green' | 'yellow' | 'red' | 'secondary' }
> {
  return {
    paid: { label: t('membershipInvoicesLeftovers.paid'), color: 'green' },
    open: { label: t('membershipInvoicesLeftovers.unpaid'), color: 'yellow' },
    uncollectible: {
      label: t('membershipInvoicesLeftovers.uncollectible'),
      color: 'red',
    },
    void: { label: t('membershipInvoicesLeftovers.void'), color: 'secondary' },
    draft: {
      label: t('membershipInvoicesLeftovers.draft'),
      color: 'secondary',
    },
  };
}

export function MembershipInvoices() {
  const { t } = useTranslation('web');
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
        {t('membershipInvoices.invoices')}
      </h3>
      {error ? (
        <InlineError className="mt-2">{error}</InlineError>
      ) : invoices === null ? (
        <InlineLoader
          label={t('membershipInvoices.loading')}
          className="mt-2"
        />
      ) : invoices.length === 0 ? (
        <PageEmpty title={t('empties.noMembershipInvoices')} />
      ) : (
        <ul className="divide-border mt-2 divide-y">
          {invoices.map((invoice) => {
            const status = invoice.status
              ? (statusLabels(t)[invoice.status] ?? {
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
                  <ListingDate
                    value={invoice.created}
                    className="text-foreground-secondary text-xs"
                  />
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
                          ? t('actions.downloadInvoiceNamed', {
                              number: invoice.number,
                            })
                          : t('actions.downloadInvoice')
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
                      {invoice.status === 'open'
                        ? t('membershipInvoicesStates.pay')
                        : t('membershipInvoicesStates.view')}
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
