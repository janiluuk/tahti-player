/** Broadcast (Go Live) page tabs — ops surface; prefs live in Settings → Broadcast. */
export const GO_LIVE_TABS = [
  'prep',
  'credentials',
  'recording',
  'destinations',
  'green-room',
] as const;

export type GoLiveTabId = (typeof GO_LIVE_TABS)[number];

export function isGoLiveTabId(value: string | undefined): value is GoLiveTabId {
  return Boolean(value && (GO_LIVE_TABS as readonly string[]).includes(value));
}

export function goLiveTabFromSearch(tab: string | undefined): GoLiveTabId {
  return isGoLiveTabId(tab) ? tab : 'prep';
}
