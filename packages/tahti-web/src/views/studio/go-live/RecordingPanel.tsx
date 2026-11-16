import { Link } from '@tanstack/react-router';
import { CircleDotIcon, FolderOpenIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { ButtonLink, Toggle } from '@tahti-player/ui';

import { StudioPanel } from '../../../components/StudioPanel';
import type { GoLiveState } from './useGoLiveState';

export function RecordingPanel({ state }: { state: GoLiveState }) {
  const { t } = useTranslation('web');
  const { recordEnabled, recordBusy, toggleRecording } = state;

  return (
    <StudioPanel
      title={t('goLiveRecording.recording')}
      description={t('goLiveRecording.forThisBroadcastOnlyDefault')}
      action={
        <ButtonLink
          variant="plain"
          size="flexible"
          to="/studio/recordings"
          hash="recording-settings"
          className="text-foreground-secondary inline-block rounded-none text-xs whitespace-normal underline-offset-2 hover:underline active:scale-100"
        >
          {t('goLiveRecording.prefs')}
        </ButtonLink>
      }
    >
      <div className="border-border bg-background flex w-full items-center gap-3 rounded-lg border p-3">
        <CircleDotIcon
          size={20}
          aria-hidden
          className={
            recordEnabled
              ? 'fill-accent-red text-accent-red'
              : 'text-foreground-secondary'
          }
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">
            {t('goLiveRecording.recordBroadcast')}
          </span>
          <span className="text-foreground-secondary block text-xs">
            {recordEnabled
              ? t('recordingPanelStates.onSavedWhenTheBroadcast')
              : t('recordingPanelStates.offThisBroadcastWillNot')}
          </span>
        </span>
        <Toggle
          label={t('goLiveRecording.recordBroadcast')}
          checked={recordEnabled}
          disabled={recordBusy}
          onChange={() => void toggleRecording()}
        />
      </div>
      <Link
        to="/studio/recordings"
        aria-label={t('goLiveRecording.openRecordings')}
        className="text-foreground-secondary mt-3 inline-flex items-center gap-1.5 text-xs underline-offset-2 hover:underline"
      >
        <FolderOpenIcon size={14} aria-hidden />
        {t('goLiveRecording.editAndReleaseSavedRecordings')}
      </Link>
    </StudioPanel>
  );
}
