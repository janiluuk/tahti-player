import { XIcon } from 'lucide-react';
import { useState } from 'react';

import { Button, Card, CardGrid, Tooltip } from '@tahti-player/ui';

import {
  NEWS_WIDGET_TYPE_ID,
  newsWidgetsOn,
  useListenerWidgetsStore,
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

/** Listen-page add-ons (Settings → Add-ons): saved Radio Browser stations,
 * news feeds, embeds, favorites. Renders nothing when empty. Curated-catalog
 * radio channels (packages/tahti-web/src/content/radioStations.ts) render in
 * ListenView's own "Radio" section instead, alongside board-curated presets —
 * having one working, reactive play-button list beats two. */
export function ListenerWidgetsSection() {
  const instances = useListenerWidgetsStore((s) => s.instances);
  const installedTypeIds = useListenerWidgetsStore((s) => s.installedTypeIds);
  const savedBrowserStations = useListenerWidgetsStore(
    (s) => s.savedBrowserStations,
  );
  const removeInstance = useListenerWidgetsStore((s) => s.removeInstance);
  const removeSavedBrowserStation = useListenerWidgetsStore(
    (s) => s.removeSavedBrowserStation,
  );
  const play = usePlayerStore((s) => s.play);
  const openSettings = useSettingsModalStore((s) => s.open);
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(
    null,
  );

  const embedInstances = instances.filter(
    (instance) => instance.typeId !== NEWS_WIDGET_TYPE_ID,
  );
  const newsFeeds = newsWidgetsOn(instances, 'listen');
  const favoritesEnabled = installedTypeIds.includes('favorites');

  if (
    embedInstances.length === 0 &&
    savedBrowserStations.length === 0 &&
    !favoritesEnabled &&
    newsFeeds.length === 0
  ) {
    return null;
  }

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

  return (
    <section
      className="mb-6 flex w-full flex-col gap-3"
      data-testid="listener-widgets-section"
    >
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">Listen add-ons</h2>
        <button
          type="button"
          onClick={() => openSettings('plugin-store', 'listen')}
          className="text-foreground-secondary text-xs underline-offset-2 hover:underline"
        >
          Manage widgets
        </button>
      </div>

      {savedBrowserStations.length > 0 && (
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
                onPlay={() =>
                  play({
                    id: `radio:${station.id}`,
                    kind: 'radio',
                    title: station.name,
                    artist: station.country ?? 'Internet radio',
                    coverUrl: station.favicon,
                    streamUrl: station.streamUrl,
                    protocol: 'https',
                    sourceProvider: 'radio',
                  })
                }
              />
            </div>
          ))}
        </CardGrid>
      )}

      {newsFeeds.length > 0 && (
        <div className="flex flex-col gap-4">
          {newsFeeds.map((instance) => (
            <NewsFeedWidget
              key={instance.id}
              instance={instance}
              onRemove={() =>
                setPendingRemoval({
                  kind: 'instance',
                  id: instance.id,
                  label: instance.label,
                })
              }
            />
          ))}
        </div>
      )}

      {embedInstances.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {embedInstances.map((instance) => (
            <ListenerWidgetEmbed
              key={instance.id}
              instance={instance}
              onRemove={() =>
                setPendingRemoval({
                  kind: 'instance',
                  id: instance.id,
                  label: instance.label,
                })
              }
            />
          ))}
        </div>
      )}

      {favoritesEnabled ? <FavoritesView embedded /> : null}

      <RemoveWidgetDialog
        isOpen={pendingRemoval != null}
        label={pendingRemoval?.label ?? ''}
        onCancel={() => setPendingRemoval(null)}
        onConfirm={confirmRemoval}
      />
    </section>
  );
}
