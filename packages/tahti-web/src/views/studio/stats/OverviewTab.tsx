import { Link } from '@tanstack/react-router';

import { useTranslation } from '@tahti-player/i18n';
import { cn, Meter, statToneClasses } from '@tahti-player/ui';

import { StudioPanel } from '../../../components/StudioPanel';
import { Eyebrow } from '../../../components/tahti/Eyebrow';
import { StatNumber } from '../../../components/tahti/StatNumber';
import { dateLocaleTag } from '../../../lib/locale';
import { DownloadGatesPanel } from './DownloadGatesPanel';
import { ENGAGEMENT_UNIT_TONES } from './metricTones';
import type { StatsData } from './useStatsData';

function EngagementUnitList({
  entries,
}: {
  entries: StatsData['engagementEntries'];
}) {
  const most = Math.max(1, ...entries.map((entry) => entry.value));
  return (
    <ul className="flex flex-col gap-3" data-testid="engagement-units">
      {entries.map((entry) => (
        <li key={entry.id} className="flex flex-col gap-1.5 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="font-medium">
              {entry.label}{' '}
              <span className="text-foreground-secondary text-xs font-normal">
                {entry.sublabel}
              </span>
            </span>
            <strong className="tabular-nums">
              {entry.value.toLocaleString(dateLocaleTag())}
            </strong>
          </div>
          <Meter
            aria-hidden
            value={entry.value}
            max={most}
            data-tone={ENGAGEMENT_UNIT_TONES[entry.id] ?? 'primary'}
            barClassName={
              statToneClasses[ENGAGEMENT_UNIT_TONES[entry.id] ?? 'primary'].fill
            }
          />
        </li>
      ))}
    </ul>
  );
}

export function KeyMetrics({ state }: { state: StatsData }) {
  const { t } = useTranslation('web');
  const { keyMetrics, loading } = state;
  const [hero, ...rest] = keyMetrics;
  if (!hero) {
    return null;
  }
  const HeroIcon = hero.icon;
  const heroTone = statToneClasses[hero.tone];

  return (
    <section
      className="flex flex-col gap-4"
      aria-label={t('overviewTab.keyMetrics')}
    >
      <StudioPanel
        className={cn(
          'border-l-4 !p-5 sm:!p-6',
          heroTone.edge,
          'from-background-secondary/80 via-background-secondary/40 bg-gradient-to-br to-transparent',
        )}
      >
        <div
          className="flex flex-wrap items-start justify-between gap-4"
          data-testid="key-metric"
          data-tone={hero.tone}
        >
          <div className="min-w-0 flex-1">
            <Eyebrow tone="muted">{hero.label}</Eyebrow>
            <StatNumber className="mt-1 block text-4xl sm:text-5xl">
              {loading ? '—' : hero.value.toLocaleString(dateLocaleTag())}
            </StatNumber>
            <p className="text-foreground-secondary mt-2 text-sm">
              {hero.note}
            </p>
          </div>
          <span
            aria-hidden
            className={cn(
              'flex size-12 shrink-0 items-center justify-center rounded-xl',
              heroTone.chip,
            )}
          >
            <HeroIcon size={24} aria-hidden />
          </span>
        </div>
      </StudioPanel>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rest.map((metric) => {
          const Icon = metric.icon;
          const tone = statToneClasses[metric.tone];
          return (
            <StudioPanel
              key={metric.label}
              className={cn('border-l-4 !p-4 sm:!p-5', tone.edge)}
            >
              <div
                className="flex items-center justify-between gap-3"
                data-testid="key-metric"
                data-tone={metric.tone}
              >
                <Eyebrow tone="muted">{metric.label}</Eyebrow>
                <span
                  aria-hidden
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-md',
                    tone.chip,
                  )}
                >
                  <Icon size={17} aria-hidden />
                </span>
              </div>
              <span className="font-heading text-foreground mt-1 block text-2xl font-bold tabular-nums sm:text-3xl">
                {loading ? '—' : metric.value.toLocaleString(dateLocaleTag())}
              </span>
              <p className="text-foreground-secondary mt-1 text-xs">
                {metric.note}
              </p>
            </StudioPanel>
          );
        })}
      </div>
    </section>
  );
}

export function EngagementSection({ state }: { state: StatsData }) {
  const { t } = useTranslation('web');
  const { engagementEntries, grant } = state;
  return (
    <div className="flex flex-col gap-3">
      <StudioPanel
        title={t('overviewTab.engagementUnits')}
        description={t('overviewTab.engagementDescription')}
      >
        <EngagementUnitList entries={engagementEntries} />
        <div className="border-border mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
          <span className="text-foreground-secondary">
            {grant?.eligible
              ? t('overviewTab.estimatedGrantShare', { year: grant.year })
              : t('overviewTab.grantProgress', {
                  year: grant?.year ?? new Date().getFullYear(),
                })}
          </span>
          <strong>
            {grant?.eligible
              ? `€${((grant.estimateCents ?? 0) / 100).toFixed(2)}`
              : t('overviewTab.units', { count: grant?.units ?? 0 })}
          </strong>
        </div>
      </StudioPanel>

      <p className="text-foreground-secondary text-xs">
        {t('overviewTab.payoutsUnder')}{' '}
        <Link
          to="/studio/audience"
          className="underline-offset-2 hover:underline"
        >
          {t('overviewTab.revenue')}
        </Link>
        .
      </p>
    </div>
  );
}

export function OverviewTab({ state }: { state: StatsData }) {
  return (
    <div className="flex flex-col gap-4">
      <KeyMetrics state={state} />
      <EngagementSection state={state} />
      <DownloadGatesPanel />
    </div>
  );
}
