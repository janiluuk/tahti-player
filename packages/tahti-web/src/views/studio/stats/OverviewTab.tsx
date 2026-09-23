import { Link } from '@tanstack/react-router';

import { TopList } from '@tahti-player/ui';

import { StudioPanel } from '../../../components/StudioPanel';
import { Eyebrow } from '../../../components/tahti/Eyebrow';
import { StatNumber } from '../../../components/tahti/StatNumber';
import type { StatsData } from './useStatsData';

export function KeyMetrics({
  state,
  active,
}: {
  state: StatsData;
  active: boolean;
}) {
  const { keyMetrics, loading } = state;
  return (
    <section
      className={`${active ? '' : 'hidden'} grid gap-3 sm:grid-cols-2 xl:grid-cols-3`}
      aria-label="Key metrics"
    >
      {keyMetrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <StudioPanel key={metric.label} className="!p-4 sm:!p-5">
            <div className="flex items-center justify-between gap-3">
              <Eyebrow>{metric.label}</Eyebrow>
              <Icon size={17} aria-hidden className="text-primary" />
            </div>
            <StatNumber className="mt-1 block text-3xl">
              {loading ? '—' : metric.value.toLocaleString()}
            </StatNumber>
            <p className="text-foreground-secondary mt-1 text-xs">
              {metric.note}
            </p>
          </StudioPanel>
        );
      })}
    </section>
  );
}

export function EngagementSection({
  state,
  active,
}: {
  state: StatsData;
  active: boolean;
}) {
  const { engagementEntries, grant } = state;
  return (
    <div className={active ? '' : 'hidden'}>
      <StudioPanel title="Engagement units">
        <TopList
          formatValue={(value) => value.toLocaleString()}
          entries={engagementEntries}
        />
        <div className="border-border mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
          <span className="text-foreground-secondary">
            {grant?.eligible
              ? `Estimated ${grant.year} grant share`
              : `Progress toward ${grant?.year ?? new Date().getFullYear()} grant eligibility`}
          </span>
          <strong>
            {grant?.eligible
              ? `€${((grant.estimateCents ?? 0) / 100).toFixed(2)}`
              : `${grant?.units ?? 0} units`}
          </strong>
        </div>
      </StudioPanel>

      <p className="text-foreground-secondary text-xs">
        Fan subscription payouts and grant history remain under{' '}
        <Link
          to="/studio/audience"
          className="underline-offset-2 hover:underline"
        >
          Revenue
        </Link>
        . Listener geography is aggregated and does not identify individual
        listeners.
      </p>
    </div>
  );
}
