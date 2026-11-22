import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { ViewShell } from '@tahti-player/ui';

import { PageBackLink } from '../components/PageBackLink';
import { withInlineCode } from '../lib/inlineCode';
import { SLOT, withSlot } from '../lib/slotText';

function codeText(text: string): ReactNode {
  return withInlineCode(text, 'font-mono text-xs');
}

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
          {t('transparencyMethodologyText.surplus')}
        </p>
      </Section>

      <Section title={t('transparencyMethodology.engagementUnitsGrantFormula')}>
        <p className="text-foreground-secondary text-sm">
          {withSlot(
            t('transparencyMethodologyText.engagementIntro', { units: SLOT }),
            <em>{t('transparencyMethodologyText.engagementUnits')}</em>,
          )}
        </p>
        <ul className="text-foreground-secondary list-disc space-y-1 pl-5 text-sm">
          <li>
            <strong className="text-foreground">
              {t('transparencyMethodology.download')}
            </strong>{' '}
            {t('transparencyMethodologyText.downloadUnit')}
          </li>
          <li>
            <strong className="text-foreground">
              {t('transparencyMethodology.fanSubscription')}
            </strong>{' '}
            {t('transparencyMethodologyText.fanSubscriptionUnit')}
          </li>
        </ul>
        <p className="text-foreground-secondary text-sm">
          {t('transparencyMethodology.passiveStreamingHlsPlaybackDoes')}
        </p>
      </Section>

      <Section title={t('transparencyMethodology.dataPipeline')}>
        <ol className="text-foreground-secondary list-decimal space-y-1 pl-5 text-sm">
          <li>{codeText(t('transparencyMethodologyText.pipelineStripe'))}</li>
          <li>
            {t(
              'transparencyMethodology.theTreasurerManuallyEntersInfrastructure',
            )}
          </li>
          <li>{codeText(t('transparencyMethodologyText.pipelineRollup'))}</li>
          <li>{codeText(t('transparencyMethodologyText.pipelineApi'))}</li>
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
            {t('transparencyMethodologyText.apiMonthly')}
          </li>
          <li>
            <code className="font-mono text-xs">
              GET /api/v1/transparency/ytd
            </code>{' '}
            {t('transparencyMethodologyText.apiYtd')}
          </li>
          <li>
            <code className="font-mono text-xs">
              GET /api/v1/transparency/categories
            </code>{' '}
            {t('transparencyMethodologyText.apiCategories')}
          </li>
        </ul>
      </Section>

      <footer className="text-foreground-secondary border-border border-t pt-4 text-xs">
        {t('transparencyMethodologyText.footer')}{' '}
        <Link to="/status" className="underline-offset-2 hover:underline">
          {t('transparencyMethodology.platformStatus')}
        </Link>
      </footer>
    </ViewShell>
  );
}
