import { Link } from '@tanstack/react-router';
import {
  BarChart3Icon,
  DownloadIcon,
  PencilIcon,
  PlayIcon,
} from 'lucide-react';

import { Button, Tooltip } from '@tahti-player/ui';

import type { StudioSound } from '../../../api/studio-types';
import { AddToPlaylistButton } from '../../../components/AddToPlaylistButton';
import { StudioSoundRowMenu } from '../../../components/StudioSoundRowMenu';
import {
  EMBED_PROVIDER_HEIGHT,
  EMBED_PROVIDER_LABEL,
  embedSrcFor,
} from '../../../lib/embedSrc';
import { isPinned } from '../../../lib/pinnedTracks';
import type { StudioSoundsState } from './useStudioSoundsState';

function formatUploadDate(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function SoundRow({
  item,
  state,
}: {
  item: StudioSound;
  state: StudioSoundsState;
}) {
  const {
    busyId,
    embedOpenId,
    playItem,
    playEmbedItem,
    downloadItem,
    togglePin,
    setEditingId,
    setStatsItem,
    setPendingDeleteItem,
  } = state;

  const embedSrc =
    item.embedProvider && item.embedUri
      ? embedSrcFor(item.embedProvider, item.embedUri)
      : null;

  return (
    <li className="flex flex-wrap items-center gap-2 py-3 text-sm first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <Link
          to="/t/$id"
          params={{ id: item.id }}
          className="font-medium hover:underline"
        >
          {item.title}
        </Link>
        <p className="text-foreground-secondary text-xs">
          {item.status}
          {formatUploadDate(item.createdAt)
            ? `, uploaded ${formatUploadDate(item.createdAt)}`
            : ''}
          {isPinned(item) ? ', pinned' : ''}
          {item.durationSec != null
            ? `, ${Math.round(item.durationSec / 60)} min`
            : ''}
          {item.genre ? `, ${item.genre}` : ''}
          {item.isPublic === false ? ', private' : ''}
          {embedSrc ? `, via ${EMBED_PROVIDER_LABEL[item.embedProvider!]}` : ''}
        </p>
      </div>
      <Tooltip
        content={
          embedSrc
            ? `Play on ${EMBED_PROVIDER_LABEL[item.embedProvider!]}`
            : 'Play'
        }
        side="top"
      >
        <Button
          size="icon-sm"
          disabled={busyId === item.id}
          onClick={() =>
            embedSrc
              ? void playEmbedItem(item)
              : void playItem(item.id, item.title)
          }
          aria-label={
            embedSrc
              ? `Play ${item.title} on ${EMBED_PROVIDER_LABEL[item.embedProvider!]}`
              : `Play ${item.title}`
          }
        >
          <PlayIcon size={16} aria-hidden />
        </Button>
      </Tooltip>
      {item.downloadsEnabled ? (
        <Tooltip content="Download original" side="top">
          <Button
            size="icon-sm"
            variant="text"
            disabled={busyId === item.id}
            onClick={() => void downloadItem(item)}
            aria-label={`Download ${item.title}`}
          >
            <DownloadIcon size={16} aria-hidden />
          </Button>
        </Tooltip>
      ) : null}
      <Tooltip content="Edit track" side="top">
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label={`Edit ${item.title}`}
          onClick={() => setEditingId(item.id)}
        >
          <PencilIcon size={16} aria-hidden />
        </Button>
      </Tooltip>
      <Tooltip content="Stats" side="top">
        <Button
          size="icon-sm"
          variant="text"
          onClick={() => setStatsItem(item)}
          aria-label={`Show stats for ${item.title}`}
        >
          <BarChart3Icon size={16} aria-hidden />
        </Button>
      </Tooltip>
      <AddToPlaylistButton soundId={item.id} trackTitle={item.title} />
      <StudioSoundRowMenu
        item={item}
        busy={busyId === item.id}
        hasEmbed={Boolean(embedSrc)}
        onTogglePin={() => void togglePin(item)}
        onDelete={() => setPendingDeleteItem(item)}
      />
      {embedSrc && embedOpenId === item.id && (
        <iframe
          title={item.title}
          src={embedSrc}
          width="100%"
          height={EMBED_PROVIDER_HEIGHT[item.embedProvider!]}
          style={{ border: 0, display: 'block' }}
          allow="autoplay; encrypted-media"
          loading="lazy"
        />
      )}
    </li>
  );
}
