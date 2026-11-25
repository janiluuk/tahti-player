import { useTranslation } from '@tahti-player/i18n';
import { HelpTip, Select } from '@tahti-player/ui';

import {
  FULL_PLAYER_TITLE_TRANSITIONS,
  toFullPlayerTitleTransition,
  usePlaybackPrefsStore,
  type FullPlayerTitleTransition,
} from '../../../stores/playbackPrefsStore';

/** Settings → Appearance: how the full-screen player's title changes. */
export function FullPlayerTitleTransitionSetting() {
  const { t } = useTranslation('web');
  const value = usePlaybackPrefsStore((s) => s.fullPlayerTitleTransition);
  const setValue = usePlaybackPrefsStore((s) => s.setFullPlayerTitleTransition);
  const labels: Record<FullPlayerTitleTransition, string> = {
    fade: t('fullPlayerTitleTransition.fade'),
    'slide-up': t('fullPlayerTitleTransition.slideUp'),
    'soft-scale': t('fullPlayerTitleTransition.softScale'),
    'slide-side': t('fullPlayerTitleTransition.slideSide'),
  };
  const options = FULL_PLAYER_TITLE_TRANSITIONS.map((id) => ({
    id,
    label: labels[id],
  }));

  return (
    <div
      className="flex w-full max-w-xl flex-col gap-1.5"
      data-testid="full-player-title-transition-setting"
    >
      <div className="flex items-center gap-1">
        <span className="text-sm font-semibold">
          {t('fullPlayerTitleTransition.label')}
        </span>
        <HelpTip
          label={t('fullPlayerTitleTransition.helpLabel')}
          content={t('fullPlayerTitleTransition.description')}
        />
      </div>
      <Select
        aria-label={t('fullPlayerTitleTransition.label')}
        options={options}
        value={value}
        onValueChange={(next) => setValue(toFullPlayerTitleTransition(next))}
      />
    </div>
  );
}
