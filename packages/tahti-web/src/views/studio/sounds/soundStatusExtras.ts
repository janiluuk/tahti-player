import type { TFunction } from '@tahti-player/i18n';

import type { StudioSound } from '../../../api/studio-types';
import { EMBED_PROVIDER_LABEL, embedSrcFor } from '../../../lib/embedSrc';
import { isPinned } from '../../../lib/pinnedTracks';

export function soundStatusExtras(
  item: StudioSound,
  t: TFunction<'web'>,
): string {
  const parts: string[] = [];
  if (isPinned(item)) {
    parts.push(t('library.soundPinned'));
  }
  if (item.durationSec != null) {
    parts.push(
      t('library.soundDurationMin', {
        minutes: Math.round(item.durationSec / 60),
      }),
    );
  }
  if (item.genre) {
    parts.push(`, ${item.genre}`);
  }
  if (item.isPublic === false) {
    parts.push(t('library.soundPrivate'));
  }
  if (item.downloadsEnabled === false) {
    parts.push(t('library.soundDownloadsOff'));
  }
  const embedSrc =
    item.embedProvider && item.embedUri
      ? embedSrcFor(item.embedProvider, item.embedUri)
      : null;
  if (embedSrc && item.embedProvider) {
    parts.push(
      t('library.soundVia', {
        provider: EMBED_PROVIDER_LABEL[item.embedProvider],
      }),
    );
  }
  return parts.join('');
}
