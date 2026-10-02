import { DownloadIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@tahti-player/ui';

import {
  fetchObsPreset,
  type ObsPreset,
  type ObsRecommendedSettings,
} from '../api/obs-preset';

function downloadJson(value: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function recommendedSettingsRows(
  settings: ObsRecommendedSettings,
): { label: string; value: string }[] {
  return [
    {
      label: 'Audio',
      value: `${settings.audioCodec} · ${settings.audioBitrateKbps} kbps · ${(settings.sampleRateHz / 1000).toLocaleString('en')} kHz · ${settings.channels}`,
    },
    {
      label: 'Video',
      value: `${settings.videoCodec} · ${settings.videoBitrateKbps} kbps`,
    },
    {
      label: 'Keyframe interval',
      value: `${settings.keyframeIntervalSec} s`,
    },
    {
      label: 'Preset / profile / tune',
      value: `${settings.preset} / ${settings.profile} / ${settings.tune}`,
    },
  ];
}

export function ObsPresetButton() {
  const [preset, setPreset] = useState<ObsPreset | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchObsPreset().then((result) => {
      if (!cancelled && result.ok) {
        setPreset(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const downloadPreset = async () => {
    let current = preset;
    if (!current) {
      setLoading(true);
      const result = await fetchObsPreset();
      setLoading(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      current = result.data;
      setPreset(current);
    }
    downloadJson(current.sceneCollection, current.sceneCollectionFilename);
  };

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-3">
      {preset ? (
        <dl
          aria-label="Recommended OBS settings"
          className="text-foreground-secondary grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs"
        >
          {recommendedSettingsRows(preset.recommended).map((row) => (
            <div key={row.label} className="contents">
              <dt>{row.label}</dt>
              <dd className="text-foreground tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <Button
        size="sm"
        variant="secondary"
        disabled={loading}
        onClick={() => void downloadPreset()}
        title="Download an OBS scene collection (Scene Collection → Import in OBS)"
      >
        <DownloadIcon size={14} aria-hidden className="mr-1.5" />
        Download OBS preset
      </Button>
    </div>
  );
}
