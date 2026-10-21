import { XIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import {
  Button,
  Card,
  CardGrid,
  Tooltip,
  type SortableBlock,
} from '@tahti-player/ui';

import {
  BROWSER_STATIONS_BLOCK_ID,
  FAVORITES_BLOCK_ID,
  NEWS_WIDGET_TYPE_ID,
  newsWidgetsOn,
  useListenerWidgetsStore,
  widgetBlockId,
} from '../stores/listenerWidgetsStore';
import { usePlayerStore } from '../stores/playerStore';
import { useSettingsModalStore } from '../stores/settingsModalStore';
import { FavoritesView } from '../views/FavoritesView';
import { ListenerWidgetEmbed } from './ListenerWidgetEmbed';
import { NewsFeedWidget } from './NewsFeedWidget';
import { RemoveWidgetDialog } from './RemoveWidgetDialog';

type PendingRemoval =
  | { kind: 'instance'; id: string; label: string }
  | { kind: 'browser'; id: string; label: string };

/** One Listen block per add-on (Settings → Add-ons): the saved Radio
 * Browser stations, each news feed, each embed, and favorites. Curated
 * catalog stations render in ListenView's own "Radio" section instead.
 * `dialog` is the remove confirmation and must be rendered once. */
export function useListenerWidgetBlocks(): {
  blocks: SortableBlock[];
  dialog: ReactNode;
} {
  const instances = useListenerWidgetsStore((s) => s.instances);
  const installedTypeIds = useListenerWidgetsStore((s) => s.installedTypeIds);
  const savedBrowserStations = useListenerWidgetsStore(
    (s) => s.savedBrowserStations,
  );
  const removeInstance = useListenerWidgetsStore((s) => s.removeInstance);
  const removeSavedBrowserStation = useListenerWidgetsStore(
    (s) => s.removeSavedBrowserStation,
  );
  const playFromList = usePlayerStore((s) => s.playFromList);
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(
    null,
  );

  const embedInstances = instances.filter(
    (instance) => instance.typeId !== NEWS_WIDGET_TYPE_ID,
  );
  const newsIds = new Set(
    newsWidgetsOn(instances, 'listen').map((instance) => instance.id),
  );
  const favoritesEnabled = installedTypeIds.includes('favorites');

  const confirmRemoval = () => {
    if (!pendingRemoval) {
      return;
    }
    if (pendingRemoval.kind === 'instance') {
      removeInstance(pendingRemoval.id);
    } else {
      removeSavedBrowserStation(pendingRemoval.id);
    }
    setPendingRemoval(null);
  };

  const blocks: SortableBlock[] = [];

  if (savedBrowserStations.length > 0) {
    blocks.push({
      id: BROWSER_STATIONS_BLOCK_ID,
      label: 'Saved stations',
      content: (
        <CardGrid>
          {savedBrowserStations.map((station) => (
            <div key={station.id} className="group relative w-fit">
              <Tooltip content={`Remove ${station.name}`} side="top">
                <Button
                  size="icon-sm"
                  variant="text"
                  aria-label={`Remove ${station.name}`}
                  onClick={() =>
                    setPendingRemoval({
                      kind: 'browser',
                      id: station.id,
                      label: station.name,
                    })
                  }
                  className="bg-background/80 hover:bg-background absolute top-1 right-1 z-10 rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <XIcon size={14} aria-hidden />
                </Button>
              </Tooltip>
              <Card
                src={station.favicon}
                title={station.name}
                subtitle={station.country ?? 'Internet radio'}
                playLabel="Play"
                onPlay={() => {
                  const playables = savedBrowserStations
                    .filter((row) => Boolean(row.streamUrl))
                    .map((row) => ({
                      id: `radio:${row.id}`,
                      kind: 'radio' as const,
                      title: row.name,
                      artist: row.country ?? 'Internet radio',
                      coverUrl: row.favicon,
                      streamUrl: row.streamUrl,
                      protocol: 'https' as const,
                      sourceProvider: 'radio',
                    }));
                  const index = playables.findIndex(
                    (row) => row.id === `radio:${station.id}`,
                  );
                  if (index < 0) {
                    return;
                  }
                  playFromList(playables, index);
                }}
              />
            </div>
          ))}
        </CardGrid>
      ),
    });
  }

  instances.forEach((instance) => {
    const onRemove = () =>
      setPendingRemoval({
        kind: 'instance',
        id: instance.id,
        label: instance.label,
      });
    if (newsIds.has(instance.id)) {
      blocks.push({
        id: widgetBlockId(instance.id),
        label: instance.label,
        content: <NewsFeedWidget instance={instance} onRemove={onRemove} />,
      });
    } else if (embedInstances.includes(instance)) {
      blocks.push({
        id: widgetBlockId(instance.id),
        label: instance.label,
        content: (
          <ListenerWidgetEmbed instance={instance} onRemove={onRemove} />
        ),
      });
    }
  });

  if (favoritesEnabled) {
    blocks.push({
      id: FAVORITES_BLOCK_ID,
      label: 'Favorites',
      content: <FavoritesView embedded />,
    });
  }

  return {
    blocks,
    dialog: (
      <RemoveWidgetDialog
        isOpen={pendingRemoval != null}
        label={pendingRemoval?.label ?? ''}
        onCancel={() => setPendingRemoval(null)}
        onConfirm={confirmRemoval}
      />
    ),
  };
}

/** The add-ons on their own, newest first, under a "Listen add-ons" heading.
 * Renders nothing when empty. ListenView places the blocks itself. */
export function ListenerWidgetsSection() {
  const openSettings = useSettingsModalStore((s) => s.open);
  const { blocks, dialog } = useListenerWidgetBlocks();

  if (blocks.length === 0) {
    return null;
  }

  return (
    <section
      className="mb-6 flex w-full flex-col gap-3"
      data-testid="listener-widgets-section"
    >
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">Listen add-ons</h2>
        <Button
          variant="text"
          size="flexible"
          type="button"
          onClick={() => openSettings('plugin-store', 'listen')}
          className="text-foreground-secondary text-xs underline-offset-2 hover:bg-transparent hover:underline"
        >
          Manage widgets
        </Button>
      </div>
      {blocks.map((block) => (
        <div key={block.id} className="min-w-0">
          {block.content}
        </div>
      ))}
      {dialog}
    </section>
  );
}
