import { Database, HardDrive, PieChart } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { DonutChart, InlineLoader, StatTile } from '@tahti-player/ui';

import {
  fetchStorageUsage,
  type StorageUsage,
} from '../../../api/studio-extras';
import { SettingsHint } from '../SettingsFields';

export function formatStorageBytes(bytes: number | null): string {
  if (bytes == null || !Number.isFinite(bytes)) {
    return '—';
  }
  if (bytes >= 1024 ** 3) {
    return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  }
  if (bytes >= 1024 ** 2) {
    return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}

/** Ring colour for the used share: calm until the quota is nearly full. */
export function usedColor(percent: number): string {
  if (percent >= 90) {
    return 'var(--accent-red)';
  }
  if (percent >= 75) {
    return 'var(--accent-yellow)';
  }
  return 'var(--accent-green)';
}

/** Settings → Account → Storage: used vs free as a donut with totals. */
export function AccountStoragePanel() {
  const { t } = useTranslation('web');
  const [storage, setStorage] = useState<StorageUsage | null>(null);

  useEffect(() => {
    void fetchStorageUsage().then((result) => setStorage(result.data));
  }, []);

  if (!storage) {
    return <InlineLoader label={t('settingsBody.account.loadingStorage')} />;
  }

  const limited = !storage.unlimited && Boolean(storage.quotaBytes);
  const quota = storage.quotaBytes ?? 0;
  const freeBytes = limited ? Math.max(0, quota - storage.usedBytes) : null;
  const usedPercent = limited
    ? Math.min(100, (storage.usedBytes / quota) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 text-primary-strong flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Database size={19} aria-hidden />
        </div>
        <div>
          <h2 className="font-semibold">
            {t('settingsBody.account.yourStorage')}
          </h2>
          <p className="text-foreground-secondary mt-1 text-sm">
            {t('settingsBody.account.storageDescription')}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        {limited ? (
          <DonutChart
            data-testid="account-storage-donut"
            size={168}
            thickness={24}
            segments={[
              {
                id: 'used',
                value: storage.usedBytes,
                color: usedColor(usedPercent),
              },
              {
                id: 'free',
                value: freeBytes ?? 0,
                color: 'var(--background-secondary)',
              },
            ]}
            centerLabel={t('settingsBody.account.used')}
            centerValue={`${Math.round(usedPercent)}%`}
            aria-label={t('settingsBody.account.storagePercentUsed', {
              percent: Math.round(usedPercent),
            })}
          />
        ) : null}
        <div className="grid w-full flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile
            label={t('settingsBody.account.used')}
            value={formatStorageBytes(storage.usedBytes)}
            tone="orange"
            icon={<HardDrive size={14} />}
          />
          <StatTile
            label={t('settingsBody.account.storageFree')}
            value={
              limited
                ? formatStorageBytes(freeBytes)
                : t('settingsBody.account.unlimited')
            }
            tone="green"
            icon={<PieChart size={14} />}
          />
          <StatTile
            label={t('settingsBody.account.quota')}
            value={
              storage.unlimited
                ? t('settingsBody.account.unlimited')
                : formatStorageBytes(storage.quotaBytes)
            }
            tone="blue"
            icon={<Database size={14} />}
          />
        </div>
      </div>

      <SettingsHint>
        {t('settingsBody.account.storageMembershipHint')}
      </SettingsHint>
    </div>
  );
}
