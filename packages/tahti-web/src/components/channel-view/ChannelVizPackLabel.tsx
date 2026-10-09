import { SparklesIcon } from 'lucide-react';

import { Badge, Tooltip } from '@tahti-player/ui';

import type { PublicChannel } from '../../api/types';
import {
  channelHeaderShowsVisualizer,
  channelVizPackFromJson,
} from '../../lib/channelVizPacks';

type PackInput = Pick<
  PublicChannel,
  | 'visualSettingsJson'
  | 'headerStyle'
  | 'videoBackgroundUrl'
  | 'galleryMode'
  | 'slideshowImages'
>;

/** "This show uses X" for listeners, only while the header actually runs
 * the visualizer the pack drives. */
export function ChannelVizPackLabel({ channel }: { channel: PackInput }) {
  const pack = channelVizPackFromJson(channel.visualSettingsJson);
  if (!pack || !channelHeaderShowsVisualizer(channel)) {
    return null;
  }
  return (
    <Tooltip content={pack.description} side="bottom">
      <Badge
        variant="pill"
        color="secondary"
        className="gap-1.5"
        data-testid="channel-viz-pack-label"
      >
        <SparklesIcon size={12} aria-hidden />
        This show uses {pack.label}
      </Badge>
    </Tooltip>
  );
}
