/** Broadcast (Go Live) page tabs — ops surface; prefs live in Settings → Broadcast. */
export const GO_LIVE_TABS = [
  'prep',
  'credentials',
  'recording',
  'destinations',
  'green-room',
] as const;

export type GoLiveTabId = (typeof GO_LIVE_TABS)[number];

export const GO_LIVE_TAB_LABELS: Record<GoLiveTabId, string> = {
  prep: 'Prep',
  credentials: 'Credentials',
  recording: 'Recording',
  destinations: 'Destinations',
  'green-room': 'Green room',
};

export function isGoLiveTabId(value: string | undefined): value is GoLiveTabId {
  return Boolean(value && (GO_LIVE_TABS as readonly string[]).includes(value));
}

export function goLiveTabFromSearch(tab: string | undefined): GoLiveTabId {
  return isGoLiveTabId(tab) ? tab : 'prep';
}

export function goLiveTabPath(tab: GoLiveTabId): string {
  return tab === 'prep' ? '/studio/go-live' : `/studio/go-live?tab=${tab}`;
}

/** Session chrome for `/studio/go-live` (and legacy `/studio/info`). */
export function isGoLiveSessionRoute(current: string | undefined): boolean {
  const pathname = current?.split('?')[0] ?? '';
  return pathname === '/studio/go-live' || pathname === '/studio/info';
}

export function isGoLiveSessionTabActive(
  current: string | undefined,
  tab: GoLiveTabId,
): boolean {
  if (!isGoLiveSessionRoute(current)) {
    return false;
  }
  const query = current?.includes('?')
    ? current.slice(current.indexOf('?') + 1)
    : '';
  const params = new URLSearchParams(query);
  return goLiveTabFromSearch(params.get('tab') ?? undefined) === tab;
}
