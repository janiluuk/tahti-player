import type { AmbientTrackRowDensity } from '../components/AmbientTrackRow';
import type { TrackListView } from '../stores/trackListViewStore';

export const PHONE_QUERY = '(max-width: 767px)';

/** The view a phone shows when nobody picked one: the plain list when the
 * listing has one, else the tightest row density. */
export function phoneDefaultView(hasList: boolean): TrackListView {
  return hasList ? 'list' : 'dense';
}

/** Which view a track listing shows. A controlled view, a stored pick and a
 * list's own starting view always win; only the fallback changes on phones. */
export function resolveTrackListView({
  controlledView,
  persist,
  storedView,
  pickedView,
  initialView,
  defaultDensity,
  isPhone,
  hasList,
}: {
  controlledView?: TrackListView;
  persist: boolean;
  storedView: TrackListView | null;
  pickedView: TrackListView | null;
  initialView?: TrackListView;
  defaultDensity: AmbientTrackRowDensity;
  isPhone: boolean;
  hasList: boolean;
}): TrackListView {
  if (controlledView !== undefined) {
    return controlledView;
  }
  const picked = persist ? storedView : (pickedView ?? initialView ?? null);
  if (picked) {
    return picked;
  }
  return isPhone ? phoneDefaultView(hasList) : defaultDensity;
}
