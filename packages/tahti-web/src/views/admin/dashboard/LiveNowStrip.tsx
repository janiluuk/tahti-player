import { RadioIcon } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, ButtonLink, MediaArtwork } from '@tahti-player/ui';

import type { AdminLiveStream } from '../../../api/admin';
import { StudioPanel } from '../../../components/StudioPanel';

const PREVIEW_COUNT = 8;

export function formatLiveDuration(sec: number): string {
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function LiveNowStrip({ streams }: { streams: AdminLiveStream[] }) {
  const { t } = useTranslation('web');
  const [showAll, setShowAll] = useState(false);
  if (streams.length === 0) {
    return null;
  }
  const visible = showAll ? streams : streams.slice(0, PREVIEW_COUNT);
  const title = t('adminDashboardViewLabels.liveNowLength', {
    length: streams.length,
  });

  return (
    <StudioPanel
      id="live-now"
      title={title}
      icon={RadioIcon}
      compact
      className="scroll-mt-20"
      action={
        <ButtonLink to="/admin/streams" size="sm" variant="text">
          {t('adminDashboard.manageStreams')}
        </ButtonLink>
      }
    >
      <ul className="flex flex-wrap gap-2" aria-label={title}>
        {visible.map((stream) => (
          <li
            key={stream.slug}
            className="border-border bg-background flex max-w-full min-w-0 items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm"
          >
            <MediaArtwork
              src={stream.avatarUrl}
              alt={stream.artistName}
              seed={stream.username ?? stream.slug}
              size="sm"
              className="size-6 min-w-6 rounded-full"
            />
            <span className="min-w-0 truncate font-medium">
              {stream.artistName}
            </span>
            <span className="text-foreground-secondary shrink-0 text-xs tabular-nums">
              {formatLiveDuration(stream.elapsedSec)}
            </span>
          </li>
        ))}
      </ul>
      {streams.length > PREVIEW_COUNT ? (
        <Button
          size="sm"
          variant="text"
          className="mt-1"
          aria-expanded={showAll}
          onClick={() => setShowAll((open) => !open)}
        >
          {showAll
            ? t('adminDashboard.showFewer')
            : t('adminDashboard.showAllCount', { count: streams.length })}
        </Button>
      ) : null}
    </StudioPanel>
  );
}
