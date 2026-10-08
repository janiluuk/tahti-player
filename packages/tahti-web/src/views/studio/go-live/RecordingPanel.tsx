import { Link } from '@tanstack/react-router';
import { CircleDotIcon, FolderOpenIcon } from 'lucide-react';

import { Button, Toggle } from '@tahti-player/ui';

import { StudioPanel } from '../../../components/StudioPanel';
import { useSettingsModalStore } from '../../../stores/settingsModalStore';
import type { GoLiveState } from './useGoLiveState';

export function RecordingPanel({ state }: { state: GoLiveState }) {
  const { recordEnabled, recordBusy, toggleRecording } = state;

  return (
    <StudioPanel
      title="Recording"
      description="For this broadcast only. Default on/off for future shows is in Settings → Broadcast → Radio."
      action={
        <Button
          variant="plain"
          size="flexible"
          type="button"
          className="text-foreground-secondary inline-block rounded-none text-xs whitespace-normal underline-offset-2 hover:underline active:scale-100"
          onClick={() => useSettingsModalStore.getState().open('broadcast')}
        >
          Prefs
        </Button>
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
          <span className="block text-sm font-semibold">Record broadcast</span>
          <span className="text-foreground-secondary block text-xs">
            {recordEnabled
              ? 'On · saved when the broadcast ends'
              : 'Off · this broadcast will not be saved'}
          </span>
        </span>
        <Toggle
          label="Record broadcast"
          checked={recordEnabled}
          disabled={recordBusy}
          onChange={() => void toggleRecording()}
        />
      </div>
      <Link
        to="/library/recordings"
        aria-label="Open recordings"
        className="text-foreground-secondary mt-3 inline-flex items-center gap-1.5 text-xs underline-offset-2 hover:underline"
      >
        <FolderOpenIcon size={14} aria-hidden />
        Edit and release saved recordings
      </Link>
    </StudioPanel>
  );
}
