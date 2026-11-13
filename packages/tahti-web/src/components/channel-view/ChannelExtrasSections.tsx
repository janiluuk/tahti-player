import type { PublicChannelBlock } from '../../api/channel-blocks';
import type { DiscoWidgetRenderItem } from '../../api/disco-widgets';
import { withoutPlacedAddons } from '../../lib/channelBlockLayout';
import { ArtistUpcomingEvents } from '../artist-view/ArtistUpcomingEvents';
import { ChannelBlocksSection } from '../disco-widgets/ChannelBlocksSection';
import { DiscoWidgetsSection } from '../disco-widgets/DiscoWidgetsSection';
import { ChannelUpcomingShows } from './ChannelUpcomingShows';

/** Calendar events, upcoming shows, add-on blocks and remaining add-ons. */
export function ChannelExtrasSections({
  slug,
  username,
  blocks,
  widgets,
  widgetsStatus,
  onRetryWidgets,
}: {
  slug: string;
  username?: string;
  blocks: PublicChannelBlock[];
  widgets: DiscoWidgetRenderItem[];
  widgetsStatus: 'loading' | 'ready' | 'error';
  onRetryWidgets: () => void;
}) {
  return (
    <>
      <ArtistUpcomingEvents
        channelSlug={slug}
        username={username}
        includePast
      />
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
