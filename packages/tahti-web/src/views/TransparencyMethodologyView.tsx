import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { ViewShell } from '@tahti-player/ui';

import { PageBackLink } from '../components/PageBackLink';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function CategoryList({
  entries,
}: {
  entries: Array<{ term: string; body: ReactNode }>;
}) {
  return (
    <dl className="flex flex-col gap-2 text-sm">
      {entries.map((entry) => (
        <div key={entry.term} className="flex flex-col gap-0.5">
          <dt className="font-mono text-xs font-semibold">{entry.term}</dt>
          <dd className="text-foreground-secondary">{entry.body}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TransparencyMethodologyView() {
  const { t } = useTranslation('web');
  return (
    <ViewShell
      title={t('transparencyMethodology.transparencyMethodology')}
      classes={{ root: 'px-0 pt-0 mx-auto max-w-3xl', content: 'gap-8' }}
    >
      <PageBackLink
        to="/transparency"
        label={t('transparencyMethodology.transparency')}
      />

      <Section title={t('transparencyMethodology.principles')}>
        <p className="text-foreground-secondary text-sm">
          {t('transparencyMethodology.tahtiRyIsAFinnish')}
        </p>
        <p className="text-foreground-secondary text-sm">
          {t('transparencyMethodology.theGoalIsRadicalTransparency')}
        </p>
      </Section>

      <Section title={t('transparencyMethodology.revenueCategories')}>
        <CategoryList
          entries={[
            {
              term: 'REVENUE_SUBSCRIPTION',
              body: t(
                'transparencyMethodologyView.monthlyMembershipFeesFromArtist',
              ),
            },
            {
              term: 'REVENUE_DISTRIBUTION',
              body: t(
                'transparencyMethodologyView.distributionHandlingFeesChargedTo',
              ),
            },
            {
              term: 'REVENUE_GRANT_INBOUND',
              body: t('transparencyMethodologyView.grantsReceivedFromPublicOr'),
            },
            {
              term: 'REVENUE_DONATION',
              body: t(
                'transparencyMethodologyView.voluntaryDonationsFromSupporters',
              ),
            },
          ]}
        />
      </Section>

      <Section title={t('transparencyMethodology.costCategories')}>
        <CategoryList
          entries={[
            {
              term: 'COST_INFRASTRUCTURE',
              body: t(
                'transparencyMethodologyView.serversBandwidthColocationDomainRegistrations',
              ),
            },
            {
              term: 'COST_DISTRIBUTION_PASSTHROUGH',
              body: t(
                'transparencyMethodologyView.revelatorApiCostPassedDirectly',
              ),
            },
            {
              term: 'COST_OPERATIONS',
              body: t(
                'transparencyMethodologyView.paymentProcessingFeesStripeSubscriptions',
              ),
            },
            {
              term: 'COST_SALARY',
              body: t(
                'transparencyMethodologyView.boardCompensationAndAnyPaid',
              ),
            },
            {
              term: 'COST_AUDIT',
              body: t(
                'transparencyMethodologyView.annualStatutoryAuditAndAccounting',
              ),
            },
            {
              term: 'COST_PROFESSIONAL_SERVICES',
              body: t(
                'transparencyMethodologyView.legalAdviceTranslationAdHoc',
              ),
            },
          ]}
        />
      </Section>

      <Section title={t('transparencyMethodology.disbursements')}>
        <CategoryList
          entries={[
            {
              term: 'GRANT_DISBURSEMENT',
              body: t('transparencyMethodologyView.annualArtistGrantsPaidTo'),
            },
            {
              term: 'RESERVE_TRANSFER',
              body: t('transparencyMethodologyView.movementsToOrFromThe'),
            },
          ]}
        />
      </Section>

      <Section title={t('transparencyMethodology.howSurplusIsCalculated')}>
        <p className="text-foreground-secondary text-sm">
          Surplus = total revenue − total costs (including salaries and
          professional services). Disbursements and reserve transfers are not
          costs — they are allocations of the surplus. The running surplus shown
          on the dashboard is revenue minus costs only; it does not yet subtract
          planned grant disbursements.
        </p>
      </Section>

      <Section title={t('transparencyMethodology.engagementUnitsGrantFormula')}>
        <p className="text-foreground-secondary text-sm">
          Grants are allocated proportionally by <em>engagement units</em>, not
          passive listener-hours. An engagement unit is a weighted measure that
          rewards listener commitment:
        </p>
        <ul className="text-foreground-secondary list-disc space-y-1 pl-5 text-sm">
          <li>
            <strong className="text-foreground">
              {t('transparencyMethodology.download')}
            </strong>{' '}
            of a free track = 1 unit (listener committed enough to download)
          </li>
          <li>
            <strong className="text-foreground">
              {t('transparencyMethodology.fanSubscription')}
            </strong>{' '}
            = engagement_euros × multiplier (fan paid real money)
          </li>
        </ul>
        <p className="text-foreground-secondary text-sm">
          {t('transparencyMethodology.passiveStreamingHlsPlaybackDoes')}
        </p>
      </Section>

      <Section title={t('transparencyMethodology.dataPipeline')}>
        <ol className="text-foreground-secondary list-decimal space-y-1 pl-5 text-sm">
          <li>
            Stripe webhooks automatically create{' '}
            <code className="font-mono text-xs">REVENUE_SUBSCRIPTION</code>{' '}
            entries.
          </li>
          <li>
            {t(
              'transparencyMethodology.theTreasurerManuallyEntersInfrastructure',
            )}
          </li>
          <li>
            On the first of each month a background job aggregates the prior
            month into a finalized{' '}
            <code className="font-mono text-xs">MonthlyRollup</code> row. The
            treasurer marks it finalized after board review.
          </li>
          <li>
            All data is immediately available via the public read-only API at{' '}
            <code className="font-mono text-xs">/api/v1/transparency/</code>.
          </li>
        </ol>
      </Section>

      <Section title={t('transparencyMethodology.publicApi')}>
        <p className="text-foreground-secondary text-sm">
          {t('transparencyMethodology.allEndpointsReturnJsonAnd')}
        </p>
        <ul className="text-foreground-secondary list-disc space-y-1 pl-5 text-sm">
          <li>
            <code className="font-mono text-xs">
              GET /api/v1/transparency/monthly_rollup?year=YYYY
            </code>{' '}
            — all finalized month rollups for a given year
          </li>
          <li>
            <code className="font-mono text-xs">
              GET /api/v1/transparency/ytd
            </code>{' '}
            — current year running totals
          </li>
          <li>
            <code className="font-mono text-xs">
              GET /api/v1/transparency/categories
            </code>{' '}
            — category descriptions
          </li>
        </ul>
      </Section>

      <footer className="text-foreground-secondary border-border border-t pt-4 text-xs">
        Tahti ry — Y-tunnus 3368171-8 — Helsinki, Finland.{' '}
        <Link to="/status" className="underline-offset-2 hover:underline">
          {t('transparencyMethodology.platformStatus')}
        </Link>
      </footer>
    </ViewShell>
  );
}
