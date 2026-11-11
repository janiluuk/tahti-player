import { PlayIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import {
  RELEASE_TRACK_STEM_ROLE_LABELS,
  type PublicReleaseTrackStem,
  type ReleaseTrackStemRole,
} from '../api/release-track-stems';
import { cn } from '../lib/cn';
import { usePlayerStore } from '../stores/playerStore';

function roleLabel(role: string): string {
  return (
    RELEASE_TRACK_STEM_ROLE_LABELS[role as ReleaseTrackStemRole] ??
    role.charAt(0).toUpperCase() + role.slice(1)
  );
}

export function ReleaseTrackStemsList({
  stems,
  trackTitle,
  artist,
  coverUrl,
  className,
}: {
  stems: PublicReleaseTrackStem[] | undefined;
  trackTitle: string;
  artist: string;
  coverUrl?: string | null;
  className?: string;
}) {
  const { t } = useTranslation('web');
  const play = usePlayerStore((state) => state.play);
  const ready = (stems ?? []).filter((stem) => stem.audioUrl || stem.playUrl);
  if (ready.length === 0) {
    return null;
  }

  return (
    <div className={cn('mt-2 flex flex-col gap-1.5', className)}>
      <p className="text-foreground-secondary text-xs font-medium tracking-wide uppercase">
        {t('releaseStems.heading')}
      </p>
      <ul className="flex flex-col gap-1">
        {ready.map((stem) => {
          const streamUrl = stem.audioUrl ?? stem.playUrl ?? '';
          return (
            <li key={stem.id} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate">
                {roleLabel(stem.role)}
              </span>
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label={t('releaseStems.playAria', {
                  role: roleLabel(stem.role),
                  title: trackTitle,
                })}
                onClick={() =>
                  play({
                    id: `stem:${stem.id}`,
                    kind: 'sound',
                    title: `${trackTitle} · ${roleLabel(stem.role)}`,
                    artist,
                    coverUrl: coverUrl ?? undefined,
                    streamUrl,
                    protocol: streamUrl.includes('.m3u8') ? 'hls' : 'https',
                  })
                }
              >
                <PlayIcon size={14} aria-hidden />
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
