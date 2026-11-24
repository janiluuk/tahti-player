/** True only when someone is actually broadcasting. The 24/7 rotation also
 * sets `state` to LIVE but never sets `goneLiveAt`, which marks a real go-live
 * (same rule as the API's channel listing). */
export function isHumanLive(
  channel:
    { state?: string | null; goneLiveAt?: string | null } | null | undefined,
): boolean {
  return channel?.state === 'LIVE' && Boolean(channel.goneLiveAt);
}
