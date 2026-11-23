import { toast } from 'sonner';

import { i18n } from '@tahti-player/i18n';

import { patchChannelVisual } from '../api/channel-design/patch';
import {
  hasLocalArtistLookVisibility,
  loadArtistLookVisibility,
  parseArtistLookVisibility,
  saveArtistLookVisibility,
  type ArtistLookBlockId,
} from './channelLookElements';

/** Saves which artist page blocks show: locally for this browser and on the
 * channel (`artistBlockVisibility`) so visitors and other devices get it. */
export async function persistArtistLookVisibility(
  slug: string,
  visibility: Record<ArtistLookBlockId, boolean>,
): Promise<boolean> {
  saveArtistLookVisibility(slug, visibility);
  const result = await patchChannelVisual({
    artistBlockVisibility: visibility,
  });
  if (!result.ok) {
    toast.error(i18n.t('web:toasts.artistBlocksSaveFailed'));
    return false;
  }
  return true;
}

const uploadedSlugs = new Set<string>();

/** Choices made before the channel kept them lived only in the owner's
 * browser: upload one once per session when the channel has none. Call only
 * for the signed-in owner's own channel. */
export function uploadLocalArtistLookVisibilityOnce(
  slug: string,
  serverJson: string | null | undefined,
): void {
  if (
    !slug ||
    serverJson ||
    uploadedSlugs.has(slug) ||
    !hasLocalArtistLookVisibility(slug)
  ) {
    return;
  }
  uploadedSlugs.add(slug);
  void persistArtistLookVisibility(slug, loadArtistLookVisibility(slug));
}

/** The designer's look load: the channel's saved choice replaces this
 * browser's copy; with none saved, an old local-only copy is uploaded. */
export function syncArtistLookVisibilityFromChannel(
  slug: string,
  serverJson: string | null | undefined,
): void {
  const server = parseArtistLookVisibility(serverJson);
  if (server) {
    saveArtistLookVisibility(slug, server);
    return;
  }
  uploadLocalArtistLookVisibilityOnce(slug, serverJson);
}
