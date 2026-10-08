import { DownloadIcon, ImagePlayIcon, SquareIcon } from 'lucide-react';

import { Button, Select } from '@tahti-player/ui';

import { MAX_HEADER_VIDEO_BYTES } from '../../api/channel-design';
import {
  EXPORT_DURATION_OPTIONS,
  EXPORT_RESOLUTION_OPTIONS,
  type ExportDurationSec,
  type ExportResolutionId,
} from './exportVisualizerClip';

export type VisualizerExportPanelProps = {
  durationSec: ExportDurationSec;
  resolutionId: ExportResolutionId;
  exporting: boolean;
  progress: number;
  error: string | null;
  resultFile: File | null;
  disabled?: boolean;
  onDurationChange: (value: ExportDurationSec) => void;
  onResolutionChange: (value: ExportResolutionId) => void;
  onStart: () => void;
  onCancel: () => void;
  onUseAsBackground: () => void;
  onDownload: () => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function VisualizerExportPanel({
  durationSec,
  resolutionId,
  exporting,
  progress,
  error,
  resultFile,
  disabled = false,
  onDurationChange,
  onResolutionChange,
  onStart,
  onCancel,
  onUseAsBackground,
  onDownload,
}: VisualizerExportPanelProps) {
  const overLimit =
    resultFile != null && resultFile.size > MAX_HEADER_VIDEO_BYTES;

  return (
    <section
      className="border-border flex flex-col gap-3 rounded-lg border p-3"
      data-testid="visualizer-export-panel"
    >
      <h3 className="text-sm font-semibold">Export clip</h3>
      <p className="text-foreground-secondary text-xs">
        Records the live preview (video only). Keep under{' '}
        {formatBytes(MAX_HEADER_VIDEO_BYTES)} to use as channel background.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Duration"
          value={String(durationSec)}
          disabled={exporting}
          options={EXPORT_DURATION_OPTIONS.map((seconds) => ({
            id: String(seconds),
            label: `${seconds} seconds`,
          }))}
          onValueChange={(value) =>
            onDurationChange(Number(value) as ExportDurationSec)
          }
        />
        <Select
          label="Quality"
          value={resolutionId}
          disabled={exporting}
          options={EXPORT_RESOLUTION_OPTIONS.map((option) => ({
            id: option.id,
            label: option.label,
          }))}
          onValueChange={(value) =>
            onResolutionChange(value as ExportResolutionId)
          }
        />
      </div>

      {exporting ? (
        <div className="flex flex-col gap-2">
          <div
            className="bg-background-secondary h-2 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            aria-label="Export progress"
          >
            <div
              className="bg-primary h-full transition-[width] duration-150"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <Button type="button" variant="secondary" onClick={onCancel}>
            <SquareIcon size={14} aria-hidden />
            <span className="ml-2">Cancel export</span>
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          disabled={disabled}
          onClick={onStart}
          data-testid="visualizer-export-start"
        >
          Export {durationSec}s clip
        </Button>
      )}

      {error ? (
        <p className="text-accent-red-strong text-xs" role="alert">
          {error}
        </p>
      ) : null}

      {resultFile ? (
        <div className="border-border flex flex-col gap-2 rounded-md border p-3">
          <p className="text-sm font-medium">
            Ready · {formatBytes(resultFile.size)}
            {overLimit ? ' (too large for background upload)' : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={overLimit}
              data-testid="visualizer-use-as-background"
              onClick={onUseAsBackground}
            >
              <ImagePlayIcon size={16} aria-hidden />
              <span className="ml-2">Use as background video</span>
            </Button>
            <Button type="button" variant="secondary" onClick={onDownload}>
              <DownloadIcon size={16} aria-hidden />
              <span className="ml-2">Download</span>
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
