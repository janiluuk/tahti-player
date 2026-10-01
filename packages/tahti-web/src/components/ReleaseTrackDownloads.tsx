import { DownloadIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@tahti-player/ui';

import {
  downloadReleaseTrack,
  type SmartLinkTrack,
} from '../api/release-download';
import { Eyebrow } from './tahti/Eyebrow';

export function ReleaseTrackDownloads({
  smartLinkSlug,
  tracks,
}: {
  smartLinkSlug: string;
  tracks: SmartLinkTrack[];
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const downloadable = tracks.filter(
    (track): track is SmartLinkTrack & { id: string } =>
      Boolean(track.id && track.audioUrl),
  );

  if (downloadable.length === 0) {
    return null;
  }

  const download = async (trackId: string) => {
    setBusyId(trackId);
    const result = await downloadReleaseTrack(smartLinkSlug, trackId);
    setBusyId(null);
    if (!result.ok) {
      const { unlockSoundId } = result;
      if (unlockSoundId) {
        toast.error(result.error, {
          action: {
            label: 'Unlock on the track page',
            onClick: () => window.location.assign(`/t/${unlockSoundId}`),
          },
        });
      } else {
        toast.error(result.error);
      }
      return;
    }
    window.location.assign(result.url);
  };

  return (
    <section className="flex flex-col gap-3" aria-label="Downloads">
      <Eyebrow>Download</Eyebrow>
      <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
        {downloadable.map((track) => (
          <li
            key={track.id}
            className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
          >
            <span className="min-w-0 truncate">
              {track.position}. {track.title}
            </span>
            <Button
              size="sm"
              variant="secondary"
              aria-label={`Download ${track.title}`}
              disabled={busyId === track.id}
              onClick={() => void download(track.id)}
            >
              <DownloadIcon size={14} aria-hidden className="mr-1.5" />
              {busyId === track.id ? 'Preparing…' : 'Download'}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
