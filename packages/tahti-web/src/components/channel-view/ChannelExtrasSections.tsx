import type { PublicChannelBlock } from '../../api/channel-blocks';
import type { DiscoWidgetRenderItem } from '../../api/disco-widgets';
import { withoutPlacedAddons } from '../../lib/channelBlockLayout';
import { ChannelBlocksSection } from '../disco-widgets/ChannelBlocksSection';
import { DiscoWidgetsSection } from '../disco-widgets/DiscoWidgetsSection';
import { ChannelUpcomingShows } from './ChannelUpcomingShows';

/** Upcoming shows, the add-on block layout and the remaining add-ons below a channel page. */
export function ChannelExtrasSections({
  slug,
  blocks,
  widgets,
  widgetsStatus,
  onRetryWidgets,
}: {
  slug: string;
  blocks: PublicChannelBlock[];
  widgets: DiscoWidgetRenderItem[];
  widgetsStatus: 'loading' | 'ready' | 'error';
  onRetryWidgets: () => void;
}) {
  return (
    <>
      <ChannelUpcomingShows slug={slug} />
      <ChannelBlocksSection blocks={blocks} />
      <DiscoWidgetsSection
        widgets={withoutPlacedAddons(widgets, blocks)}
        status={widgetsStatus}
        onRetry={onRetryWidgets}
      />
    </>
  );
}
