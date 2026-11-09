import { VolumeXIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import { usePlayerStore } from '../stores/playerStore';

/** Shown while a channel that started on its own is playing muted: one
 * press to hear it. Nothing is drawn when the mute is the listener's own. */
export function AutoplayUnmuteNotice() {
  const { t } = useTranslation('web');
  const waiting = usePlayerStore(
    (s) => s.autoplayRestoreMuted !== null && s.muted,
  );
  const unmute = usePlayerStore((s) => s.unmuteAutoplay);

  if (!waiting) {
    return null;
  }
  return (
    <div
      role="status"
      className="border-border bg-background-secondary flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
    >
      <span className="flex items-center gap-2">
        <VolumeXIcon size={16} aria-hidden />
        {t('autoplayUnmuteNotice.thisChannelIsPlayingMuted')}
      </span>
      <Button size="sm" variant="secondary" onClick={unmute}>
        {t('autoplayUnmuteNotice.unmute')}
      </Button>
    </div>
  );
}
