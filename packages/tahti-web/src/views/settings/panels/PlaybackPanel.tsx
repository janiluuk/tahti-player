import { useEffect, useState } from 'react';

import type { RepeatMode } from '@tahti-player/model';
import {
  Input,
  SectionShell,
  SegmentedControl,
  Slider,
} from '@tahti-player/ui';

import {
  clampSkipSeconds,
  SKIP_SECONDS_MAX,
  SKIP_SECONDS_MIN,
  usePlaybackPrefsStore,
} from '../../../stores/playbackPrefsStore';
import { usePlayerStore } from '../../../stores/playerStore';
import { SettingsToggle } from '../SettingsFields';

const REPEAT_OPTIONS = [
  { id: 'off', label: 'Off' },
  { id: 'all', label: 'Repeat queue' },
  { id: 'one', label: 'Repeat track' },
] as const satisfies readonly { id: RepeatMode; label: string }[];

const SECTION_DIVIDER = 'border-border border-t pt-6';

function SkipDurationField() {
  const skipSeconds = usePlaybackPrefsStore((s) => s.skipSeconds);
  const setSkipSeconds = usePlaybackPrefsStore((s) => s.setSkipSeconds);
  const [draft, setDraft] = useState(String(skipSeconds));

  useEffect(() => {
    setDraft(String(skipSeconds));
  }, [skipSeconds]);

  const commit = () => {
    const next = clampSkipSeconds(Number(draft));
    setSkipSeconds(next);
    setDraft(String(next));
  };

  return (
    <Input
      variant="number"
      min={SKIP_SECONDS_MIN}
      max={SKIP_SECONDS_MAX}
      label="Skip duration"
      description={`Number of seconds to skip forward/backward with Shift+←/→ and media keys (${SKIP_SECONDS_MIN}–${SKIP_SECONDS_MAX}).`}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          commit();
        }
      }}
    />
  );
}

export function PlaybackPanel() {
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const setRepeatMode = usePlayerStore((s) => s.setRepeatMode);

  return (
    <div className="flex w-full max-w-xl flex-col" data-testid="playback-panel">
      <SectionShell title="Output">
        <div className="flex flex-col gap-6">
          <div className="px-2">
            <Slider
              label="Volume"
              description="Output level for tracks, radio and live streams."
              showFooter
              unit="%"
              min={0}
              max={100}
              step={1}
              startLabel="Quiet"
              endLabel="Loud"
              value={Math.round(volume * 100)}
              onValueChange={(value) => setVolume(value / 100)}
            />
          </div>
          <SettingsToggle
            label="Mute"
            description="Silence playback without changing the volume level."
            value={muted}
            onChange={() => toggleMute()}
          />
        </div>
      </SectionShell>
      <SectionShell title="Queue" className={SECTION_DIVIDER}>
        <div className="flex flex-col gap-6">
          <SettingsToggle
            label="Shuffle"
            description="Pick the next queued track at random."
            value={shuffle}
            onChange={() => toggleShuffle()}
          />
          <div className="flex flex-col gap-2">
            <span className="text-foreground text-sm font-semibold">
              Repeat
            </span>
            <SegmentedControl
              aria-label="Repeat"
              options={REPEAT_OPTIONS}
              value={repeatMode}
              onChange={setRepeatMode}
              className="self-start"
            />
            <p className="text-foreground-secondary text-sm select-none">
              What happens when the queue reaches its last track. Radio and live
              streams ignore this.
            </p>
          </div>
        </div>
      </SectionShell>
      <SectionShell
        title="Skipping and transitions"
        className={SECTION_DIVIDER}
      >
        <div className="flex flex-col gap-6">
          <SkipDurationField />
          <Input
            variant="number"
            label="Crossfade"
            description="Crossfade duration between tracks in milliseconds. Not supported on web yet."
            value="0"
            disabled
            readOnly
            className="cursor-not-allowed opacity-60"
          />
        </div>
      </SectionShell>
    </div>
  );
}
