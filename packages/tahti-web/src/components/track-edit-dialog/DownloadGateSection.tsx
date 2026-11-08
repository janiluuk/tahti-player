import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Toggle } from '@tahti-player/ui';

import {
  fetchSoundDownloadGateStats,
  type SoundDownloadGateStats,
} from '../../api/studio-extras/sound-download-gate';

export function DownloadGateSection({
  soundId,
  followToDownload,
  repostToDownload,
  onChange,
}: {
  soundId: string;
  followToDownload: boolean;
  repostToDownload: boolean;
  onChange: (patch: {
    followToDownload?: boolean;
    repostToDownload?: boolean;
  }) => void;
}) {
  const { t } = useTranslation('web');
  const [stats, setStats] = useState<SoundDownloadGateStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchSoundDownloadGateStats(soundId).then((result) => {
      if (!cancelled) {
        setStats(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [soundId]);

  const gated = followToDownload || repostToDownload;

  return (
    <div className="border-border flex flex-col gap-3 rounded-lg border p-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <span>
          <span className="block font-medium">
            {t('downloadGateSection.requireAFollow')}
          </span>
          <span className="text-foreground-secondary block text-xs">
            {t('downloadGateSection.listenersFollowYouBeforeThe')}
          </span>
        </span>
        <Toggle
          label={t('downloadGateSection.requireAFollow')}
          checked={followToDownload}
          onChange={(value) => onChange({ followToDownload: value })}
        />
      </div>
      <div className="flex items-start justify-between gap-3">
        <span>
          <span className="block font-medium">
            {t('downloadGateSection.requireARepost')}
          </span>
          <span className="text-foreground-secondary block text-xs">
            {t('downloadGateSection.listenersRepostTheTrackBefore')}
          </span>
        </span>
        <Toggle
          label={t('downloadGateSection.requireARepost')}
          checked={repostToDownload}
          onChange={(value) => onChange({ repostToDownload: value })}
        />
      </div>
      {gated && stats ? (
        <p
          className="text-foreground-secondary border-border/60 border-t pt-3 text-xs"
          data-testid="download-gate-stats"
        >
          Last 14 days: {stats.countedDownloadCount.toLocaleString()} downloads,{' '}
          {stats.blockedDownloadAttempts.toLocaleString()} stopped at the gate,{' '}
          {stats.repostAckCount.toLocaleString()} reposts.
        </p>
      ) : null}
    </div>
  );
}
