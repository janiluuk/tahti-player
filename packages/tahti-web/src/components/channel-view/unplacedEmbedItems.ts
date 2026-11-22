import { listenerWidgetType } from '../../content/listenerWidgets';
import type { ChannelPageItem } from '../../lib/channelPageLayout';
import type { ListenerWidgetInstance } from '../../stores/listenerWidgetsStore';

export type UnplacedEmbedItem = {
  id: string;
  label: string;
  hint: string;
  embedInstanceId: string;
};

/** The listener's configured external players that are not on the channel
 * layout yet, offered by the layers panel's "add embed" list. */
export function unplacedEmbedItems(
  instances: ListenerWidgetInstance[],
  layout: ChannelPageItem[],
  fallbackHint: string,
): UnplacedEmbedItem[] {
  return instances
    .filter((instance) => Boolean(listenerWidgetType(instance.typeId)))
    .filter(
      (instance) =>
        !layout.some(
          (item) =>
            item.type === 'embed' && item.embedInstanceId === instance.id,
        ),
    )
    .map((instance) => ({
      id: instance.id,
      label: instance.label,
      hint: listenerWidgetType(instance.typeId)?.name ?? fallbackHint,
      embedInstanceId: instance.id,
    }));
}
