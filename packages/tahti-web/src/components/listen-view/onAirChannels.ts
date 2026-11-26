import type { OnAirChannel, OnAirChannelResponse } from '../../api/listen';
import { TAHTI_RADIO_SLUG } from '../../api/mock';
import { isPlausiblePublicName } from '../../lib/publicDisplayName';
import type { StationHealth } from '../../stores/stationHealthStore';

/**
 * A Replay-tier channel can play only while its 24/7 rotation is airing a
 * real track. The API leaves `hlsUrl` null for a channel that is not airing,
 * and `nowPlaying` null once the orchestrator has not seen a track for two
 * minutes: a channel with no public sounds still streams, but only silence.
 */
export function isPlayableReplay(channel: OnAirChannel): boolean {
  return Boolean(channel.hlsUrl && channel.nowPlaying);
}

/** The Listen "Live & replays" row: live channels first, then replays that
 * can actually play. Tahti Radio has its own row. */
export function onAirListing({
  live,
  replaying,
}: Pick<OnAirChannelResponse, 'live' | 'replaying'>): OnAirChannel[] {
  const liveSlugs = new Set(live.map((channel) => channel.slug));
  const replays = replaying.filter(
    (channel) => !liveSlugs.has(channel.slug) && isPlayableReplay(channel),
  );
  return [
    ...live.map((channel) => ({ ...channel, state: 'LIVE' })),
    ...replays.map((channel) => ({ ...channel, state: 'REPLAY' })),
  ]
    .filter((channel) => channel.slug !== TAHTI_RADIO_SLUG)
    .filter((channel) => {
      const name = channel.user.displayName?.trim();
      return !name || isPlausiblePublicName(name);
    });
}

/** Drops replays whose stream already failed to play this session, so a
 * broken channel disappears instead of erroring again on the next tap. */
export function withoutFailedReplays(
  channels: OnAirChannel[],
  healthByUrl: Record<string, StationHealth>,
): OnAirChannel[] {
  return channels.filter(
    (channel) =>
      channel.state === 'LIVE' ||
      !channel.hlsUrl ||
      healthByUrl[channel.hlsUrl]?.state !== 'unavailable',
  );
}
