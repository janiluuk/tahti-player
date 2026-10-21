import { useEffect, useState } from 'react';

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
          <span className="block font-medium">Require a follow</span>
          <span className="text-foreground-secondary block text-xs">
            Listeners follow you before the download starts.
          </span>
        </span>
        <Toggle
          label="Require a follow"
          checked={followToDownload}
          onChange={(value) => onChange({ followToDownload: value })}
        />
      </div>
      <div className="flex items-start justify-between gap-3">
        <span>
          <span className="block font-medium">Require a repost</span>
          <span className="text-foreground-secondary block text-xs">
            Listeners repost the track before the download starts.
          </span>
        </span>
        <Toggle
          label="Require a repost"
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
