import { CheckCircle2Icon, FingerprintIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@tahti-player/ui';

import type { FingerprintMatch, StudioReleaseTrack } from '../api/studio-types';
import { acoustIdProvider } from '../plugins/fingerprinting';

function MatchSummary({ match }: { match: FingerprintMatch }) {
  return (
    <p className="text-sm">
      Matches “{match.title ?? 'an unnamed recording'}”
      {match.artist ? ` by ${match.artist}` : ''} —{' '}
      {Math.round(match.score * 100)}% confidence.
    </p>
  );
}

export function FingerprintTrackPanel({
  releaseId,
  track,
  onUpdated,
}: {
  releaseId: string;
  track: StudioReleaseTrack;
  onUpdated: (match: FingerprintMatch | null) => void;
}) {
  const [busy, setBusy] = useState<'refingerprint' | 'check' | null>(null);
  const [checkResult, setCheckResult] = useState<
    FingerprintMatch | 'none' | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const handleRefingerprint = async () => {
    setError(null);
    setCheckResult(null);
    setBusy('refingerprint');
    const result = await acoustIdProvider.match(releaseId, track.id);
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onUpdated(result.data.match);
  };

  const handleCheck = async () => {
    setError(null);
    setBusy('check');
    const result = await acoustIdProvider.check(releaseId, track.id);
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCheckResult(result.data.match ?? 'none');
  };

  return (
    <div className="border-border flex flex-col gap-3 rounded-md border-(length:--border-width) p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">{track.title}</span>
        {track.fingerprintMatch ? (
          <span className="text-accent-yellow-strong flex items-center gap-1.5 text-xs">
            <FingerprintIcon size={14} aria-hidden />
            Match on file
          </span>
        ) : (
          <span className="text-foreground-secondary flex items-center gap-1.5 text-xs">
            <CheckCircle2Icon size={14} aria-hidden />
            No match on file
          </span>
        )}
      </div>

      {track.fingerprintMatch && (
        <MatchSummary match={track.fingerprintMatch} />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={busy !== null}
          onClick={() => void handleRefingerprint()}
        >
          <FingerprintIcon size={14} aria-hidden className="mr-1.5" />
          {busy === 'refingerprint' ? 'Fingerprinting…' : 'Re-fingerprint'}
        </Button>
        <Button
          size="sm"
          variant="text"
          disabled={busy !== null}
          onClick={() => void handleCheck()}
        >
          <SearchIcon size={14} aria-hidden className="mr-1.5" />
          {busy === 'check' ? 'Checking…' : 'Check for a match'}
        </Button>
      </div>

      {checkResult === 'none' && (
        <p className="text-foreground-secondary text-sm">
          No match found. Nothing was changed.
        </p>
      )}
      {checkResult && checkResult !== 'none' && (
        <div className="border-border bg-background rounded-md border-(length:--border-width) p-3">
          <p className="text-foreground-secondary mb-1 text-xs uppercase">
            Preview only — not saved
          </p>
          <MatchSummary match={checkResult} />
        </div>
      )}
      {error && (
        <p className="text-accent-red-strong text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
