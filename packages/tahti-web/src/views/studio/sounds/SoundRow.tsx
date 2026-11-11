import { Link } from '@tanstack/react-router';
import {
  BarChart3Icon,
  DownloadIcon,
  PlayIcon,
  RotateCcwIcon,
} from 'lucide-react';
import { useRef } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Checkbox,
  EditIconButton,
  InlineError,
  MediaArtwork,
  Tooltip,
  TrackProcessing,
} from '@tahti-player/ui';

import type { StudioSound } from '../../../api/studio-types';
import { AddToPlaylistButton } from '../../../components/AddToPlaylistButton';
import { StudioSoundRowMenu } from '../../../components/StudioSoundRowMenu';
import {
  canRetrySoundProcessing,
  useRetrySoundProcessing,
} from '../../../hooks/useRetrySoundProcessing';
import {
  EMBED_PROVIDER_HEIGHT,
  EMBED_PROVIDER_LABEL,
  embedSrcFor,
} from '../../../lib/embedSrc';
import { useDominantColor } from '../../../lib/useDominantColor';
import { formatUploadDate } from './SoundsAmbientList';
import { soundStatusExtras } from './soundStatusExtras';
import type { StudioSoundsState } from './useStudioSoundsState';

function ambientStyle(
  rgb: [number, number, number] | null,
): { backgroundImage: string } | undefined {
  if (!rgb) {
    return undefined;
  }
  const [r, g, b] = rgb;
  return {
    backgroundImage: `linear-gradient(90deg, rgba(${r}, ${g}, ${b}, 0.42), rgba(${r}, ${g}, ${b}, 0.12) 45%, transparent 85%)`,
  };
}

export function SoundRow({
  item,
  state,
}: {
  item: StudioSound;
  state: StudioSoundsState;
}) {
  const { t } = useTranslation('web');
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
    setItems,
    selectedIds,
    toggleSelected,
  } = state;
  const shiftHeld = useRef(false);
  const { retry, retryingId } = useRetrySoundProcessing((id) =>
    setItems((prev) =>
      prev.map((sound) =>
        sound.id === id
          ? { ...sound, status: 'PENDING', processingError: null }
          : sound,
      ),
    ),
  );
  const failed = item.status === 'ERROR';
  const processing =
    !item.embedProvider &&
    (item.status === 'PENDING' || item.status === 'PROCESSING');
  const rgb = useDominantColor(item.bannerUrl);

  const embedSrc =
    item.embedProvider && item.embedUri
      ? embedSrcFor(item.embedProvider, item.embedUri)
      : null;
  const inlineProviderEmbed =
    embedSrc && embedOpenId === item.id && item.embedProvider !== 'HEARTHIS';

  return (
    <li
      className="flex flex-wrap items-center gap-2 py-3 text-sm first:pt-0 last:pb-0"
      style={ambientStyle(rgb)}
    >
      <Checkbox
        checked={selectedIds.has(item.id)}
        onClick={(event) => {
          shiftHeld.current = event.shiftKey;
        }}
        onChange={() => toggleSelected(item.id, { shift: shiftHeld.current })}
        aria-label={t('soundRowLabels.selectTitle', { title: item.title })}
      />
      <div className="relative shrink-0 overflow-hidden rounded-md">
        <MediaArtwork
          src={item.bannerUrl ?? undefined}
          size="sm"
          seed={item.id}
          alt=""
        />
        {processing ? (
          <TrackProcessing variant="overlay" label="" decorative />
        ) : null}
      </div>
      <div className="min-w-44 flex-1">
        <Link
          to="/t/$id"
          params={{ id: item.id }}
          className="font-medium hover:underline"
        >
          {item.title}
        </Link>
        <p className="text-foreground-secondary text-xs">
          {processing ? (
            <TrackProcessing />
          ) : failed ? (
            t('library.processingFailed')
          ) : (
            item.status
          )}
          {formatUploadDate(item.createdAt)
            ? t('library.uploadedOn', {
                date: formatUploadDate(item.createdAt)!,
              })
            : ''}
          {soundStatusExtras(item, t)}
        </p>
        {failed && item.processingError ? (
          <InlineError textSize="xs" announce={false}>
            {item.processingError}
          </InlineError>
        ) : null}
      </div>
      {canRetrySoundProcessing(item) ? (
        <Button
          size="xs"
          variant="secondary"
          disabled={retryingId === item.id}
          onClick={() => void retry(item)}
          aria-label={t('library.soundRetryAria', { title: item.title })}
        >
          <RotateCcwIcon size={14} aria-hidden className="mr-1" />
          {t('library.soundRetry')}
        </Button>
      ) : null}
      <div
        className="relative flex max-w-full min-w-0 flex-wrap items-center gap-2"
        data-testid="sound-row-actions"
      >
        {!item.embedProvider ? (
          <Tooltip content={t('soundRow.playShiftClickToQueue')} side="top">
            <Button
              size="icon-sm"
              variant="secondary"
              disabled={processing || busyId === item.id}
              onClick={(event) => {
                void playItem(item.id, item.title, {
                  queue: event.shiftKey,
                });
              }}
              aria-label={t('soundRowLabels.playTitle', { title: item.title })}
            >
              <PlayIcon size={16} aria-hidden />
            </Button>
          </Tooltip>
        ) : (
          <Tooltip
            content={t('tooltips.playOnShiftQueue', {
              provider: EMBED_PROVIDER_LABEL[item.embedProvider!],
            })}
            side="top"
          >
            <Button
              size="icon-sm"
              variant="secondary"
              disabled={busyId === item.id}
              onClick={(event) => {
                void playEmbedItem(item, { queue: event.shiftKey });
              }}
              aria-label={`Play ${item.title} on ${EMBED_PROVIDER_LABEL[item.embedProvider!]}`}
            >
              <PlayIcon size={16} aria-hidden />
            </Button>
          </Tooltip>
        )}
        {!item.embedProvider ? (
          <Tooltip content={t('soundRow.downloadOriginal')} side="top">
            <Button
              size="icon-sm"
              variant="text"
              disabled={busyId === item.id}
              onClick={() => void downloadItem(item)}
              aria-label={t('actions.downloadItem', { title: item.title })}
            >
              <DownloadIcon size={16} aria-hidden />
            </Button>
          </Tooltip>
        ) : null}
        <EditIconButton
          variant="text"
          label={t('actions.editNamed', { name: item.title })}
          onClick={() => setEditingId(item.id)}
        />
        <Tooltip content={t('soundRow.stats')} side="top">
          <Button
            size="icon-sm"
            variant="text"
            onClick={() => setStatsItem(item)}
            aria-label={t('soundRowLabels.showStatsForTitle', {
              title: item.title,
            })}
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
      </div>
      {inlineProviderEmbed ? (
        <div className="w-full basis-full">
          <iframe
            title={item.title}
            src={embedSrc}
            width="100%"
            height={EMBED_PROVIDER_HEIGHT[item.embedProvider!]}
            style={{ border: 0, display: 'block' }}
            allow="autoplay; encrypted-media"
            loading="lazy"
          />
        </div>
      ) : null}
    </li>
  );
}
