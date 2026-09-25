import { Link } from '@tanstack/react-router';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  InboxIcon,
  SettingsIcon,
  XIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

import {
  Button,
  ButtonLink,
  Dialog,
  EmptyState,
  ImageReveal,
  Loader,
  Tooltip,
} from '@tahti-player/ui';

import type { DiscoverArtistOfWeek } from '../../api/discover';
import type { DiscoverCollection, DiscoverTrackItem } from '../../api/types';
import type { DiscoverWidgetId } from '../../stores/discoverStore';
import { WidgetTrackRow } from './WidgetTrackRow';

const MAX_ROWS = 8;

export function WidgetCard({
  id,
  title,
  subtitle,
  loading,
  items,
  collections = [],
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
}: {
  id: DiscoverWidgetId;
  title: string;
  subtitle?: ReactNode;
  loading: boolean;
  items: DiscoverTrackItem[];
  collections?: DiscoverCollection[];
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
}) {
  const [configureOpen, setConfigureOpen] = useState(false);

  return (
    <section className="group border-border bg-background-secondary flex min-h-[280px] flex-col gap-3 rounded-md border-(length:--border-width) p-4">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{title}</h3>
          {subtitle && (
            <p className="text-foreground-secondary truncate text-xs">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isAdmin && (
            <Tooltip content="Configure widget" side="top">
              <Button
                size="icon-sm"
                variant="text"
                onClick={() => setConfigureOpen(true)}
                aria-label={`Configure ${title}`}
                className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <SettingsIcon size={14} />
              </Button>
            </Tooltip>
          )}
          <Tooltip content="Move earlier" side="top">
            <Button
              size="icon-sm"
              variant="text"
              disabled={!canMoveUp}
              onClick={() => onMove(id, 'up')}
              aria-label="Move earlier"
            >
              <ChevronUpIcon size={14} />
            </Button>
          </Tooltip>
          <Tooltip content="Move later" side="top">
            <Button
              size="icon-sm"
              variant="text"
              disabled={!canMoveDown}
              onClick={() => onMove(id, 'down')}
              aria-label="Move later"
            >
              <ChevronDownIcon size={14} />
            </Button>
          </Tooltip>
          <Tooltip content="Remove widget" side="top">
            <Button
              size="icon-sm"
              variant="text"
              onClick={() => onRemove(id)}
              aria-label="Remove widget"
              className="text-foreground-secondary hover:text-accent-red"
            >
              <XIcon size={14} />
            </Button>
          </Tooltip>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader size="sm" />
        </div>
      ) : artist ? (
        <div className="flex flex-1 flex-col items-center text-center">
          <ImageReveal
            src={artist.avatarUrl ?? undefined}
            alt={`${artist.displayName} profile`}
            className="bg-background-secondary size-40 rounded-full"
            imgClassName="object-cover"
            placeholder={
              <span className="text-foreground-secondary text-4xl font-bold">
                {artist.displayName.charAt(0).toUpperCase()}
              </span>
            }
          />
          <h4 className="mt-4 text-lg font-semibold">{artist.displayName}</h4>
          <p className="text-foreground-secondary mt-2 line-clamp-4 max-w-xl text-sm">
            {artist.bio ?? 'Discover this artist’s music on Tahti.'}
          </p>
          <ButtonLink
            to="/channel/$slug"
            params={{ slug: artist.channelSlug }}
            size="sm"
            className="mt-4"
          >
            Listen to their music
          </ButtonLink>
        </div>
      ) : collections.length > 0 ? (
        <div className="grid gap-2">
          {collections.slice(0, MAX_ROWS).map((collection) => (
            <Link
              key={`${collection.ownerUsername}:${collection.slug}`}
              to="/u/$username/c/$slug"
              params={{
                username: collection.ownerUsername,
                slug: collection.slug,
              }}
              className="border-border bg-background hover:bg-background-tertiary flex items-center gap-3 rounded-md border p-2 transition-colors"
            >
              <ImageReveal
                src={collection.coverUrl ?? undefined}
                alt=""
                className="bg-primary size-12 shrink-0 rounded"
                placeholder={
                  <span className="text-primary-foreground text-xs font-bold">
                    {collection.name.charAt(0).toUpperCase()}
                  </span>
                }
              />
              <div className="min-w-0">
                <h4 className="truncate text-sm font-semibold">
                  {collection.name}
                </h4>
                <p className="text-foreground-secondary truncate text-xs">
                  {collection.ownerDisplayName} · {collection.itemCount} tracks
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<InboxIcon size={20} aria-hidden />}
          title={emptyMessage}
        />
      ) : (
        <div className="flex flex-col gap-0.5">
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
          Adjust how this widget behaves on the Discover page.
        </Dialog.Description>
        {settings ?? (
          <p className="text-foreground-secondary mt-4 text-sm">
            This widget uses the Discover filters above. There are no additional
            settings available yet.
          </p>
        )}
        <Dialog.Actions>
          <Dialog.Close>Done</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
    </section>
  );
}
