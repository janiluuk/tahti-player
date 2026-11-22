import { useState, type ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, type SortableBlock } from '@tahti-player/ui';

import {
  FAVORITES_BLOCK_ID,
  LATEST_NEWS_BLOCK_ID,
  NEWS_WIDGET_TYPE_ID,
  newsWidgetsOn,
  useListenerWidgetsStore,
  widgetBlockId,
} from '../stores/listenerWidgetsStore';
import { useSettingsModalStore } from '../stores/settingsModalStore';
import { FavoritesView } from '../views/FavoritesView';
import { LatestNewsWidget } from './LatestNewsWidget';
import { ListenerWidgetEmbed } from './ListenerWidgetEmbed';
import { RemoveWidgetDialog } from './RemoveWidgetDialog';

type PendingRemoval = { id: string; label: string };

/** One Listen block per add-on (Settings → Add-ons): each news feed, each
 * embed, and favorites. Radio stations, curated and saved, render in
 * ListenView's own "Radio" section instead.
 * `dialog` is the remove confirmation and must be rendered once. */
export function useListenerWidgetBlocks(): {
  blocks: SortableBlock[];
  dialog: ReactNode;
} {
  const { t } = useTranslation('web');
  const instances = useListenerWidgetsStore((s) => s.instances);
  const installedTypeIds = useListenerWidgetsStore((s) => s.installedTypeIds);
  const removeInstance = useListenerWidgetsStore((s) => s.removeInstance);
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
    removeInstance(pendingRemoval.id);
    setPendingRemoval(null);
  };

  const blocks: SortableBlock[] = [];

  instances.forEach((instance) => {
    const onRemove = () =>
      setPendingRemoval({ id: instance.id, label: instance.label });
    if (newsIds.has(instance.id)) {
      if (!blocks.some((block) => block.id === LATEST_NEWS_BLOCK_ID)) {
        blocks.push({
          id: LATEST_NEWS_BLOCK_ID,
          label: t('listenerWidgetsSectionMore.latestNews'),
          content: <LatestNewsWidget surface="listen" />,
        });
      }
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
      label: t('listenerWidgetsSectionMore.favorites'),
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
  const { t } = useTranslation('web');
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
        <h2 className="text-2xl font-bold">
          {t('listenerWidgetsSection.listenAddOns')}
        </h2>
        <Button
          variant="text"
          size="flexible"
          type="button"
          onClick={() => openSettings('plugin-store', 'listen')}
          className="text-foreground-secondary text-xs underline-offset-2 hover:bg-transparent hover:underline"
        >
          {t('listenerWidgetsSection.manageWidgets')}
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
