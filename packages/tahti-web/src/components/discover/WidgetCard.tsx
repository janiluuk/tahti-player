import { Link } from '@tanstack/react-router';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  SettingsIcon,
  XIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  ButtonLink,
  Dialog,
  Loader,
  MediaArtwork,
  Tooltip,
} from '@tahti-player/ui';

import type { DiscoverArtistOfWeek } from '../../api/discover';
import type { LatestRelease } from '../../api/latest-releases';
import type { DiscoverCollection, DiscoverTrackItem } from '../../api/types';
import { cn } from '../../lib/cn';
import type { DiscoverWidgetId } from '../../stores/discoverStore';
import { ListingDate } from '../ListingDate';
import { PageEmpty, PageError } from '../PageStates';
import { STRIPED_LIST, STRIPED_ROW } from './listStripes';
import { WidgetTrackRow } from './WidgetTrackRow';

const MAX_ROWS = 8;

export function WidgetCard({
  id,
  title,
  subtitle,
  loading,
  error = null,
  onRetry,
  items,
  collections = [],
  releases = [],
  artist,
  showRank,
  emptyMessage,
  canMoveUp,
  canMoveDown,
  onMove,
  onRemove,
  onSelectTrack,
  isAdmin = false,
  settings,
  toolbar,
}: {
  id: DiscoverWidgetId;
  title: string;
  subtitle?: ReactNode;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  items: DiscoverTrackItem[];
  collections?: DiscoverCollection[];
  releases?: LatestRelease[];
  artist?: DiscoverArtistOfWeek;
  showRank?: boolean;
  emptyMessage: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (id: DiscoverWidgetId, direction: 'up' | 'down') => void;
  onRemove: (id: DiscoverWidgetId) => void;
  onSelectTrack?: (item: DiscoverTrackItem) => void;
  isAdmin?: boolean;
  /** Optional per-widget configuration, toggled open by the gear button
   * (e.g. the random-artist widget's rotation-length picker). */
  settings?: ReactNode;
  /** Controls shown under the title for every listener, e.g. a filter. */
  toolbar?: ReactNode;
}) {
  const { t } = useTranslation('web');
  const [configureOpen, setConfigureOpen] = useState(false);

  return (
    <section
      id={id}
      className="group/widget border-border bg-background-secondary shadow-float flex min-h-[240px] scroll-mt-20 flex-col gap-2 rounded-md border-(length:--border-width) p-3 [contain-intrinsic-size:auto_12rem] [content-visibility:auto] sm:min-h-[280px] sm:gap-3 sm:p-4"
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-foreground line-clamp-2 text-lg leading-tight font-bold break-words">
            {title}
          </h2>
          {subtitle && (
            <p className="text-foreground-secondary line-clamp-2 text-xs break-words">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isAdmin && (
            <Tooltip
              content={t('discoverWidgetCard.configureWidget')}
              side="top"
            >
              <Button
                size="icon-sm"
                variant="text"
                onClick={() => setConfigureOpen(true)}
                aria-label={`Configure ${title}`}
                className="opacity-0 transition-opacity group-hover/widget:opacity-100 focus-visible:opacity-100"
              >
                <SettingsIcon size={14} />
              </Button>
            </Tooltip>
          )}
          <Tooltip content={t('discoverWidgetCard.moveEarlier')} side="top">
            <Button
              size="icon-sm"
              variant="text"
              disabled={!canMoveUp}
              onClick={() => onMove(id, 'up')}
              aria-label={t('discoverWidgetCard.moveEarlier')}
            >
              <ChevronUpIcon size={14} />
            </Button>
          </Tooltip>
          <Tooltip content={t('discoverWidgetCard.moveLater')} side="top">
            <Button
              size="icon-sm"
              variant="text"
              disabled={!canMoveDown}
              onClick={() => onMove(id, 'down')}
              aria-label={t('discoverWidgetCard.moveLater')}
            >
              <ChevronDownIcon size={14} />
            </Button>
          </Tooltip>
          <Tooltip content={t('discoverWidgetCard.removeWidget')} side="top">
            <Button
              size="icon-sm"
              variant="text"
              onClick={() => onRemove(id)}
              aria-label={t('discoverWidgetCard.removeWidget')}
              className="text-foreground-secondary hover:text-accent-red-strong"
            >
              <XIcon size={14} />
            </Button>
          </Tooltip>
        </div>
      </header>

      {toolbar}

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader size="sm" />
        </div>
      ) : error ? (
        <PageError
          title={`Could not load ${title.toLowerCase()}`}
          description={error}
          onRetry={onRetry}
        />
      ) : artist ? (
        <div className="flex flex-1 flex-col items-center text-center">
          <div className="size-40 overflow-hidden rounded-full">
            <MediaArtwork
              src={artist.avatarUrl ?? undefined}
              alt={`${artist.displayName} profile`}
              seed={artist.channelSlug}
              size="fill"
              className="rounded-full"
            />
          </div>
          <h3 className="mt-4 text-lg font-semibold">{artist.displayName}</h3>
          <p className="text-foreground-secondary mt-2 line-clamp-4 max-w-xl text-sm">
            {artist.bio ?? 'Discover this artist’s music on Tahti.'}
          </p>
          <ButtonLink
            to="/channel/$slug"
            params={{ slug: artist.channelSlug }}
            size="sm"
            className="mt-4"
          >
            {t('discoverWidgetCard.listenToTheirMusic')}
          </ButtonLink>
        </div>
      ) : releases.length > 0 ? (
        <div className={STRIPED_LIST} data-testid="latest-releases">
          {releases.slice(0, MAX_ROWS).map((release) => (
            <div
              key={release.id}
              className={cn('flex items-center gap-3 p-2', STRIPED_ROW)}
            >
              <Link
                to="/r/$slug"
                params={{ slug: release.smartLinkSlug }}
                tabIndex={-1}
                aria-hidden
                className="shrink-0"
              >
                <div className="size-12 overflow-hidden rounded">
                  <MediaArtwork
                    src={release.artworkUrl ?? undefined}
                    alt=""
                    seed={release.smartLinkSlug}
                    size="fill"
                  />
                </div>
              </Link>
              <div className="min-w-0">
                <Link
                  to="/r/$slug"
                  params={{ slug: release.smartLinkSlug }}
                  className="block truncate text-sm font-semibold hover:underline"
                >
                  {release.title}
                </Link>
                <p className="text-foreground-secondary truncate text-xs">
                  {release.artistUsername ? (
                    <Link
                      to="/u/$username"
                      params={{ username: release.artistUsername }}
                      className="hover:underline"
                    >
                      {release.artistDisplayName}
                    </Link>
                  ) : (
                    release.artistDisplayName
                  )}{' '}
                  · {release.type.toLowerCase()} ·{' '}
                  <ListingDate value={release.releaseDate} />
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : collections.length > 0 ? (
        <div className={STRIPED_LIST} data-testid="public-playlists">
          {collections.slice(0, MAX_ROWS).map((collection) => (
            <Link
              key={`${collection.ownerUsername}:${collection.slug}`}
              to="/u/$username/c/$slug"
              params={{
                username: collection.ownerUsername,
                slug: collection.slug,
              }}
              className={cn('flex items-center gap-3 p-2', STRIPED_ROW)}
            >
              <div className="size-12 shrink-0 overflow-hidden rounded">
                <MediaArtwork
                  src={collection.coverUrl ?? undefined}
                  alt=""
                  seed={`${collection.ownerUsername}/${collection.slug}`}
                  size="fill"
                />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold">
                  {collection.name}
                </h3>
                <p className="text-foreground-secondary truncate text-xs">
                  {collection.ownerDisplayName} · {collection.itemCount} tracks
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : items.length === 0 ? (
        <PageEmpty title={emptyMessage} />
      ) : (
        <div className={STRIPED_LIST} data-testid="widget-track-list">
          {items.slice(0, MAX_ROWS).map((item, index) => (
            <WidgetTrackRow
              key={item.id}
              item={item}
              rank={showRank ? index + 1 : undefined}
              onSelect={onSelectTrack}
            />
          ))}
        </div>
      )}

      <Dialog.Root
        isOpen={configureOpen}
        onClose={() => setConfigureOpen(false)}
        className="max-w-lg"
      >
        <Dialog.Title>Configure {title}</Dialog.Title>
        <Dialog.Description>
          {t('discoverWidgetCard.adjustHowThisWidgetBehaves')}
        </Dialog.Description>
        {settings ?? (
          <p className="text-foreground-secondary mt-4 text-sm">
            {t('discoverWidgetCard.thisWidgetUsesTheDiscover')}
          </p>
        )}
        <Dialog.Actions>
          <Dialog.Close>{t('discoverWidgetCard.done')}</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
    </section>
  );
}
