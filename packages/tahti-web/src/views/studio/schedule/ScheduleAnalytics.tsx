import { useEffect, useState } from 'react';

import { fetchStatsPlays, type StatsPlays } from '../../../api/studio-extras';
import { StudioPanel } from '../../../components/StudioPanel';

export function ScheduleAnalytics() {
  const [stats, setStats] = useState<
    Partial<Record<'1' | '7' | '30', StatsPlays>>
  >({});

  useEffect(() => {
    void Promise.all(
      ['1', '7', '30'].map((range) =>
        fetchStatsPlays(range as '1' | '7' | '30'),
      ),
    ).then((results) => {
      setStats({
        '1': results[0]?.data,
        '7': results[1]?.data,
        '30': results[2]?.data,
      });
    });
  }, []);

  return (
    <StudioPanel
      title="Broadcast analytics"
      description="Recent listening activity around your scheduled broadcasts."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {(['1', '7', '30'] as const).map((range) => (
          <div
            key={range}
            className="border-border bg-background-secondary/40 rounded-lg border p-3"
          >
            <p className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
              Last {range} day{range === '1' ? '' : 's'}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {stats[range]?.totalPlays.toLocaleString() ?? '—'}
            </p>
            <p className="text-foreground-secondary text-xs">plays</p>
          </div>
        ))}
      </div>
    </StudioPanel>
  );
}
