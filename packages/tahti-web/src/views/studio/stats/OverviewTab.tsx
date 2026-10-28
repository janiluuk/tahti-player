import { Link } from '@tanstack/react-router';

import { cn, Meter, statToneClasses } from '@tahti-player/ui';

import { StudioPanel } from '../../../components/StudioPanel';
import { Eyebrow } from '../../../components/tahti/Eyebrow';
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
              {entry.value.toLocaleString()}
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
            <span className="font-heading text-foreground mt-1 block text-3xl font-bold tabular-nums">
              {loading ? '—' : metric.value.toLocaleString()}
            </span>
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
        <EngagementUnitList entries={engagementEntries} />
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
