import { apiGet, CliError } from '../api-client.mjs';
import { formatDetails, safeName } from '../format.mjs';

/** With no slug, the token's own channel (`GET /api/auth/me`); with one,
 * the public channel route, which needs no token and is sent none. */
export async function fetchChannel(config, slug) {
  let target = slug;
  if (!target) {
    const me = await apiGet('/api/auth/me', config);
    target = me.channel?.slug;
    if (!target) {
      throw new CliError(
        'This account has no channel. Give a channel slug: tahti channel <slug>',
      );
    }
  }
  return apiGet(`/api/channels/${encodeURIComponent(target)}`, config, {
    auth: false,
  });
}

function formatTrack(track) {
  if (!track) {
    return null;
  }
  return track.artistName
    ? `${track.artistName} — ${track.title}`
    : track.title;
}

function formatState(channel) {
  if (channel.state !== 'LIVE') {
    return channel.state;
  }
  return channel.signalConnected ? 'LIVE' : 'LIVE (no audio signal)';
}

function formatNextBroadcast(channel) {
  if (!channel.nextBroadcastAt) {
    return null;
  }
  const when = new Date(channel.nextBroadcastAt)
    .toISOString()
    .slice(0, 16)
    .replace('T', ' ');
  return channel.nextBroadcastNote
    ? `${when} UTC (${channel.nextBroadcastNote})`
    : `${when} UTC`;
}

export function formatChannel(channel) {
  return formatDetails([
    ['Channel', channel.slug],
    ['Artist', safeName(channel.user?.displayName, channel.user?.username)],
    ['State', formatState(channel)],
    ['Now playing', formatTrack(channel.nowPlaying)],
    ['Up next', formatTrack(channel.nowPlayingNext)],
    ['Next broadcast', formatNextBroadcast(channel)],
    ['Chat', channel.user?.chatEnabled === false ? 'off' : 'on'],
    ['Stream', channel.hlsUrl],
  ]);
}

export async function runChannel(config, slug, { json = false } = {}) {
  const channel = await fetchChannel(config, slug);
  if (json) {
    return JSON.stringify(channel, null, 2);
  }
  return formatChannel(channel);
}
