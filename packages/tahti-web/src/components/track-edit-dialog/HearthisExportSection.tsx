import { Link } from '@tanstack/react-router';
import { UploadCloudIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@tahti-player/ui';

import {
  exportSoundToHearthis,
  type HearthisExportStatus,
} from '../../api/hearthis-export';
import { fetchMeIntegrations } from '../../api/integrations';

const STATUS_TEXT: Record<HearthisExportStatus, string> = {
  pending: 'Queued — reopen this dialog later to see how it went.',
  submitted: 'Uploading to hearthis.at…',
  delivered: 'On your hearthis.at account.',
  failed: 'The last export failed. Try again.',
};

export function HearthisExportSection({
  soundId,
  initialStatus,
}: {
  soundId: string;
  initialStatus: HearthisExportStatus | null;
}) {
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMeIntegrations()
      .then(({ data }) => {
        if (!cancelled) {
          setInstalled(
            data.find((item) => item.slug === 'hearthis-export')?.installed ??
              false,
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInstalled(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (installed === null) {
    return null;
  }

  const inProgress = status === 'pending' || status === 'submitted';

  const run = async () => {
    setBusy(true);
    setError(null);
    const result = await exportSoundToHearthis(soundId);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStatus(result.status);
  };

  return (
    <div className="border-border flex items-center gap-4 rounded-xl border p-4">
      <UploadCloudIcon
        size={28}
        className="text-primary shrink-0"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium">Push to hearthis.at</p>
        <p
          className="text-foreground-secondary text-sm"
          data-testid="hearthis-export-status"
        >
          {!installed ? (
            <>
              Install the hearthis.at export plugin (needs hearthis.at Premium)
              in{' '}
              <Link
                to="/settings/$section"
                params={{ section: 'integrations' }}
                className="underline"
              >
                Settings → Integrations
              </Link>{' '}
              to copy this track to your own hearthis.at account.
            </>
          ) : status ? (
            STATUS_TEXT[status]
          ) : (
            'Copy this track to your own hearthis.at account.'
          )}
        </p>
        {error ? (
          <p className="text-accent-red-strong mt-1 text-sm">{error}</p>
        ) : null}
      </div>
      {installed ? (
        <Button
          size="sm"
          variant="secondary"
          disabled={busy || inProgress}
          onClick={() => void run()}
        >
          {busy
            ? 'Starting…'
            : status === 'delivered'
              ? 'Push again'
              : status === 'failed'
                ? 'Try again'
                : 'Push'}
        </Button>
      ) : null}
    </div>
  );
}
