import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  UploadIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, ButtonAnchor, Tooltip } from '@tahti-player/ui';

import {
  exportTrack,
  fetchTrackExportStatus,
  type TrackExportStatus,
} from '../api/sources';
import { EXPORT_TARGETS } from '../plugins/export';

const MIXCLOUD_TARGET = EXPORT_TARGETS.find(
  (target) => target.id === 'mixcloud' && target.supportsTracks,
);

function describe(status: TrackExportStatus): string {
  switch (status.status) {
    case 'DONE':
      return 'Uploaded to Mixcloud.';
    case 'FAILED':
      return status.error ? `Upload failed: ${status.error}` : 'Upload failed.';
    case 'UPLOADING':
      return 'Uploading to Mixcloud…';
    default:
      return 'Queued for upload.';
  }
}

export function TrackExportPanel({ soundId }: { soundId: string }) {
  const [status, setStatus] = useState<TrackExportStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectUrl, setConnectUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchTrackExportStatus(soundId, 'mixcloud').then((result) => {
      if (!cancelled) {
        setStatus(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [soundId]);

  if (!MIXCLOUD_TARGET) {
    return null;
  }

  const failed = status?.status === 'FAILED';

  return (
    <section>
      <h3 className="text-foreground-secondary mb-2 text-xs font-semibold tracking-wide uppercase">
        Per-track export
      </h3>
      <div className="border-border flex items-center gap-3 rounded-lg border px-3 py-2">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-black/80"
          style={{ background: MIXCLOUD_TARGET.color }}
          aria-hidden
        >
          M
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{MIXCLOUD_TARGET.label}</p>
          <p
            className={
              failed
                ? 'text-accent-red-strong text-xs'
                : 'text-foreground-secondary text-xs'
            }
          >
            {loading
              ? 'Checking export status…'
              : status
                ? describe(status)
                : 'Send this item to your connected account.'}
          </p>
        </div>
        {status?.url ? (
          <Tooltip content="Open on Mixcloud" side="top">
            <ButtonAnchor
              href={status.url}
              target="_blank"
              rel="noreferrer noopener"
              size="icon-sm"
              variant="secondary"
              aria-label="Open on Mixcloud"
            >
              <ExternalLinkIcon size={15} aria-hidden />
            </ButtonAnchor>
          </Tooltip>
        ) : failed ? (
          <AlertCircleIcon
            size={18}
            className="text-accent-red-strong"
            aria-hidden
          />
        ) : status ? (
          <CheckCircle2Icon
            size={18}
            className="text-primary"
            aria-label="Export added"
          />
        ) : (
          <Button
            size="sm"
            variant="secondary"
            disabled={loading || exporting}
            onClick={() => {
              setExporting(true);
              setError(null);
              setConnectUrl(null);
              void exportTrack(soundId, 'mixcloud').then((result) => {
                setExporting(false);
                if (result.ok) {
                  setStatus(result.status);
                } else {
                  setError(result.error);
                  setConnectUrl(result.connectUrl ?? null);
                }
              });
            }}
          >
            <UploadIcon size={14} className="mr-1.5" aria-hidden />
            {exporting ? 'Adding…' : 'Export'}
          </Button>
        )}
      </div>
      {error && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="text-accent-red-strong text-xs">{error}</p>
          {connectUrl ? (
            <ButtonAnchor href={connectUrl} size="sm" variant="secondary">
              Connect Mixcloud
            </ButtonAnchor>
          ) : null}
        </div>
      )}
    </section>
  );
}
