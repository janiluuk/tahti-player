import { useEffect, useState } from 'react';

import { StatTile } from '@tahti-player/ui';

import { fetchPlatformStats, type PlatformStats } from '../api/platform-stats';
import { formatBytes } from '../lib/storageFormat';

const numberFormat = new Intl.NumberFormat('en-US');

function storageLabel(bytes: number): string {
  return bytes >= 1024 ** 4
    ? `${(bytes / 1024 ** 4).toFixed(1)} TB`
    : formatBytes(bytes);
}

export function PlatformStatsStrip() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchPlatformStats().then((result) => {
      if (!cancelled) {
        setStats(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats || stats.activeArtists === 0) {
    return null;
  }

  return (
    <section
      aria-label="Tahti in numbers"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      <StatTile
        label="Broadcasting artists"
        value={numberFormat.format(stats.activeArtists)}
      />
      <StatTile
        label="Broadcasts this month"
        value={numberFormat.format(stats.broadcastsThisMonth)}
      />
      <StatTile
        label="Hours on air"
        value={numberFormat.format(stats.totalHours)}
      />
      <StatTile
        label="Music stored"
        value={storageLabel(stats.totalStorageBytes)}
      />
    </section>
  );
}
