import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
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
  const { t } = useTranslation('web');
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
      aria-label={t('platformStats.tahtiInNumbers')}
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      <StatTile
        label={t('platformStats.broadcastingArtists')}
        value={numberFormat.format(stats.activeArtists)}
      />
      <StatTile
        label={t('platformStats.broadcastsThisMonth')}
        value={numberFormat.format(stats.broadcastsThisMonth)}
      />
      <StatTile
        label={t('platformStats.hoursOnAir')}
        value={numberFormat.format(stats.totalHours)}
      />
      <StatTile
        label={t('platformStats.musicStored')}
        value={storageLabel(stats.totalStorageBytes)}
      />
    </section>
  );
}
