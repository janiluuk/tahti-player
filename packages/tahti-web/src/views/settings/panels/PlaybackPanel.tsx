import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import type { RepeatMode } from '@tahti-player/model';
import {
  Input,
  SectionShell,
  SegmentedControl,
  Slider,
} from '@tahti-player/ui';

import { getNativeLibrary } from '../../../lib/nativeLibrary';
import type { NormalizationMode } from '../../../lib/replayGain';
import { useAuthStore } from '../../../stores/authStore';
import {
  clampSkipSeconds,
  SKIP_SECONDS_MAX,
  SKIP_SECONDS_MIN,
  usePlaybackPrefsStore,
} from '../../../stores/playbackPrefsStore';
import { usePlayerStore } from '../../../stores/playerStore';
import { MyRadioStations } from '../MyRadioStations';
import { SettingsToggle } from '../SettingsFields';

function NormalizationField() {
  const { t } = useTranslation('web');
  const options = [
    { id: 'off', label: t('settingsPlayback.off') },
    { id: 'track', label: t('settingsPlayback.track') },
    { id: 'album', label: t('settingsPlayback.album') },
  ] as const satisfies readonly { id: NormalizationMode; label: string }[];
  const normalization = usePlaybackPrefsStore((s) => s.normalization);
  const setNormalization = usePlaybackPrefsStore((s) => s.setNormalization);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-foreground text-sm font-semibold">
        {t('settingsPlayback.normalization')}
      </span>
      <SegmentedControl
        aria-label={t('settingsPlayback.normalization')}
        options={options}
        value={normalization}
        onChange={setNormalization}
        className="self-start"
      />
      <p className="text-foreground-secondary text-sm select-none">
        {t('settingsPlayback.normalizationDescription')}
      </p>
    </div>
  );
}

const SECTION_DIVIDER = 'border-border border-t pt-6';

function SkipDurationField() {
  const { t } = useTranslation('web');
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
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault();
        commit();
      }}
    >
      <Input
        enterKeyHint="done"
        variant="number"
        min={SKIP_SECONDS_MIN}
        max={SKIP_SECONDS_MAX}
        label={t('settingsPlayback.skipDuration')}
        description={t('settingsPlayback.skipDurationDescription', {
          min: SKIP_SECONDS_MIN,
          max: SKIP_SECONDS_MAX,
        })}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
      />
    </form>
  );
}

export function PlaybackPanel() {
  const { t } = useTranslation('web');
  const repeatOptions = [
    { id: 'off', label: t('settingsPlayback.off') },
    { id: 'all', label: t('settingsPlayback.repeatQueue') },
    { id: 'one', label: t('settingsPlayback.repeatTrack') },
  ] as const satisfies readonly { id: RepeatMode; label: string }[];
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const channelAutoplay = usePlaybackPrefsStore((s) => s.channelAutoplay);
  const setChannelAutoplay = usePlaybackPrefsStore((s) => s.setChannelAutoplay);
  const keepScreenOn = usePlaybackPrefsStore((s) => s.keepScreenOn);
  const setKeepScreenOn = usePlaybackPrefsStore((s) => s.setKeepScreenOn);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const setRepeatMode = usePlayerStore((s) => s.setRepeatMode);
  const hasLocalAnalysis = Boolean(getNativeLibrary()?.analysis);
  const signedIn = useAuthStore((s) => Boolean(s.user));

  return (
    <div className="flex w-full max-w-xl flex-col" data-testid="playback-panel">
      <SectionShell title={t('settingsPlayback.output')}>
        <div className="flex flex-col gap-6">
          <div className="px-2">
            <Slider
              label={t('settingsPlayback.volume')}
              description={t('settingsPlayback.volumeDescription')}
              showFooter
              unit="%"
              min={0}
              max={100}
              step={1}
              startLabel={t('settingsPlayback.quiet')}
              endLabel={t('settingsPlayback.loud')}
              value={Math.round(volume * 100)}
              onValueChange={(value) => setVolume(value / 100)}
            />
          </div>
          <SettingsToggle
            label={t('settingsPlayback.mute')}
            description={t('settingsPlayback.muteDescription')}
            value={muted}
            onChange={() => toggleMute()}
          />
          <SettingsToggle
            label={t('settingsPlayback.channelAutoplay')}
            description={t('settingsPlayback.channelAutoplayDescription')}
            value={channelAutoplay}
            onChange={(value) => setChannelAutoplay(value)}
          />
          {'wakeLock' in navigator ? (
            <SettingsToggle
              label={t('settingsPlayback.keepScreenOn')}
              description={t('settingsPlayback.keepScreenOnDescription')}
              value={keepScreenOn}
              onChange={(value) => setKeepScreenOn(value)}
            />
          ) : null}
          {hasLocalAnalysis ? <NormalizationField /> : null}
        </div>
      </SectionShell>
      <SectionShell
        title={t('settingsPlayback.queue')}
        className={SECTION_DIVIDER}
      >
        <div className="flex flex-col gap-6">
          <SettingsToggle
            label={t('settingsPlayback.shuffle')}
            description={t('settingsPlayback.shuffleDescription')}
            value={shuffle}
            onChange={() => toggleShuffle()}
          />
          <div className="flex flex-col gap-2">
            <span className="text-foreground text-sm font-semibold">
              {t('settingsPlayback.repeat')}
            </span>
            <SegmentedControl
              aria-label={t('settingsPlayback.repeat')}
              options={repeatOptions}
              value={repeatMode}
              onChange={setRepeatMode}
              className="self-start"
            />
            <p className="text-foreground-secondary text-sm select-none">
              {t('settingsPlayback.repeatDescription')}
            </p>
          </div>
        </div>
      </SectionShell>
      <SectionShell
        title={t('settingsPlayback.skipping')}
        className={SECTION_DIVIDER}
      >
        <SkipDurationField />
      </SectionShell>
      {signedIn ? (
        <SectionShell
          title={t('settingsPlayback.myRadioStations')}
          className={SECTION_DIVIDER}
        >
          <MyRadioStations />
        </SectionShell>
      ) : null}
    </div>
  );
}
