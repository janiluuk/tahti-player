import type { PublicTrackDetail, TrackAccessGate } from '../../api/types';

/**
 * The API's `gate` is authoritative. Without it (older API, mock mode) the
 * gate is inferred from the access mode so a gated track never renders a
 * play button that cannot play.
 */
export function resolveTrackAccessGate(
  detail: PublicTrackDetail | null,
  {
    isOwner,
    purchaseEntitled,
  }: { isOwner: boolean; purchaseEntitled: boolean },
): TrackAccessGate | null {
  if (!detail || isOwner) {
    return null;
  }
  if (detail.gate !== undefined) {
    return detail.gate;
  }
  if (detail.accessMode === 'PURCHASE' && !purchaseEntitled) {
    return {
      reason: 'PURCHASE',
      ...(detail.purchaseTierId ? { tierId: detail.purchaseTierId } : {}),
    };
  }
  if (detail.accessMode === 'SUBSCRIBERS_ONLY' && !detail.audioUrl) {
    return { reason: 'SUBSCRIBERS_ONLY' };
  }
  return null;
}
