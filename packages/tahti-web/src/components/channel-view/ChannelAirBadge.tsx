import { Badge } from '@tahti-player/ui';

import type { PublicChannel } from '../../api/types';
import { OnAirBadge } from '../tahti/OnAirBadge';

export type ChannelAirState = 'on-air' | 'rotation' | 'offline';

type AirInput = Pick<PublicChannel, 'state' | 'hlsUrl' | 'signalConnected'>;

/** The 24/7 rotation also sets `state` to LIVE, so only a connected ingest
 * signal means someone is broadcasting. An API that sends no signal field
 * keeps the old meaning. */
export function channelAirState(channel: AirInput): ChannelAirState {
  if (channel.state !== 'LIVE' || !channel.hlsUrl) {
    return 'offline';
  }
  return channel.signalConnected === false ? 'rotation' : 'on-air';
}

export function ChannelAirBadge({ channel }: { channel: AirInput }) {
  const air = channelAirState(channel);
  if (air === 'on-air') {
    return <OnAirBadge />;
  }
  return (
    <Badge
      variant="pill"
      color="secondary"
      className="font-mono tracking-wide uppercase"
      data-testid="channel-air-badge"
    >
      {air === 'rotation' ? '24/7 rotation' : 'Offline'}
    </Badge>
  );
}
