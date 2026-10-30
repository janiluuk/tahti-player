import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Button,
  Dialog,
  InlineError,
  Input,
  Select,
  Toggle,
} from '@tahti-player/ui';

import type { AnnouncementClip } from '../../api/announcements';
import {
  applyClipEdit,
  fetchClipEditorSource,
  ORIGINAL_VOICE,
  previewClipEdit,
  voiceSettingsKey,
  type ClipEditorSource,
  type ClipPlacement,
  type ClipVoiceSettings,
} from '../../api/clip-editor';
import { isForceMock } from '../../api/mode';
import type { ProgrammeItem } from '../../api/studio-extras';
import { ConfirmDialog } from '../ConfirmDialog';
import { WaveformSeekbar } from '../tahti/WaveformSeekbar';

const effects = [
  ['removeRumble', 'Remove rumble'],
  ['compress', 'Even out voice'],
  ['deEss', 'Soften “s” sounds'],
  ['warmth', 'Warmth'],
  ['clarity', 'Clarity'],
  ['normalize', 'Match channel volume'],
] as const;

export function ClipEditorDialog({
  clip,
  programs,
  onClose,
  onSaved,
}: {
  clip: AnnouncementClip;
  programs: ProgrammeItem[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [source, setSource] = useState<ClipEditorSource | null>(null);
  const [settings, setSettings] = useState<ClipVoiceSettings>({
    ...ORIGINAL_VOICE,
    startSec: 0,
    endSec: clip.durationSec ?? 0,
    fadeInSec: 0,
    fadeOutSec: 0,
  });
  const [title, setTitle] = useState(clip.title);
  const [placement, setPlacement] = useState<ClipPlacement>({
    placement: clip.placement ?? 'BETWEEN',
    targetSoundId: clip.targetSoundId ?? null,
    scheduleMode: clip.scheduleMode ?? 'AFTER_EVERY',
    everyNth: clip.everyNth ?? 3,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState('');
  const [mode, setMode] = useState<'original' | 'processed'>('original');
  const [duration, setDuration] = useState(0);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [position, setPosition] = useState(0);
  const [loop, setLoop] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const comparePosition = useRef<number | null>(null);
  const switchMode = (next: 'original' | 'processed') => {
    comparePosition.current =
      (audio.current?.currentTime ?? 0) +
      (mode === 'processed' ? settings.startSec : 0);
    audio.current?.pause();
    setMode(next);
  };
  const alive = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const next = await fetchClipEditorSource(clip.id);
      if (!alive.current) {
        return;
      }
      setSource(next);
      const saved = next.draftSettings ?? next.editorSettings;
      if (saved) {
        setSettings(saved);
      }
      if (next.draftSettings && next.draftStatus === 'READY') {
        setPreviewKey(voiceSettingsKey(next.draftSettings));
      }
      if (next.draftStatus === 'PROCESSING') {
        setPending(next.renderToken);
      }
    } catch (err) {
      if (alive.current) {
        setError(err instanceof Error ? err.message : 'Could not load audio');
      }
    } finally {
      if (alive.current) {
        setLoading(false);
      }
    }
  }, [clip.id]);

  useEffect(() => {
    alive.current = true;
    void load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  useEffect(() => {
    if (!pending) {
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const next = await fetchClipEditorSource(clip.id);
        if (cancelled) {
          return;
        }
        if (next.renderToken !== pending) {
          throw new Error(
            'This clip was edited elsewhere. Generate a new preview.',
          );
        }
        setSource(next);
        if (next.draftStatus === 'ERROR') {
          throw new Error(
            'The preview could not be rendered. Check the trim and try again.',
          );
        }
        if (next.draftStatus === 'READY') {
          setPending(null);
          setMode('processed');
          setPreviewKey(voiceSettingsKey(next.draftSettings));
        } else {
          timer = setTimeout(() => void poll(), 2000);
        }
      } catch (err) {
        if (!cancelled) {
          setPending(null);
          setError(
            err instanceof Error ? err.message : 'Could not check preview',
          );
        }
      }
    };
    timer = setTimeout(() => void poll(), 1000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [clip.id, pending]);

  useEffect(() => {
    if (!source?.originalUrl || !globalThis.AudioContext) {
      return;
    }
    const controller = new AbortController();
    const ctx = new AudioContext();
    void fetch(source.originalUrl, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) {
          throw new Error('Waveform unavailable');
        }
        return r.arrayBuffer();
      })
      .then((bytes) => ctx.decodeAudioData(bytes))
      .then((buffer) => {
        if (controller.signal.aborted) {
          return;
        }
        setDuration(buffer.duration);
        const data = buffer.getChannelData(0);
        setPeaks(
          Array.from({ length: 160 }, (_, i) => {
            let peak = 0;
            for (
              let j = Math.floor((i * data.length) / 160);
              j < ((i + 1) * data.length) / 160;
              j++
            ) {
              peak = Math.max(peak, Math.abs(data[j] ?? 0));
            }
            return Math.min(255, Math.round(peak * 255));
          }),
        );
        setSettings((s) =>
          s.endSec > 0 ? s : { ...s, endSec: buffer.duration },
        );
      })
      .catch(() => undefined)
      .finally(() => {
        if (ctx.state !== 'closed') {
          void ctx.close();
        }
      });
    return () => {
      controller.abort();
      if (ctx.state !== 'closed') {
        void ctx.close();
      }
    };
  }, [source?.originalUrl]);

  const update = (patch: Partial<ClipVoiceSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
    setDirty(true);
    setMode('original');
    audio.current?.pause();
  };
  const valid =
    Object.values(settings).every(
      (v) => typeof v === 'boolean' || Number.isFinite(v),
    ) &&
    settings.startSec >= 0 &&
    settings.endSec > settings.startSec &&
    settings.endSec <= (duration || 600) + 0.05 &&
    settings.fadeInSec >= 0 &&
    settings.fadeOutSec >= 0 &&
    settings.fadeInSec <= 30 &&
    settings.fadeOutSec <= 30 &&
    settings.fadeInSec + settings.fadeOutSec <=
      settings.endSec - settings.startSec;
  const previewReady =
    source?.draftStatus === 'READY' &&
    Boolean(source.draftUrl) &&
    previewKey === voiceSettingsKey(settings) &&
    !pending;
  const missingTarget =
    placement.placement !== 'BETWEEN' &&
    !programs.some((p) => p.id === placement.targetSoundId);
  const renderPreview = async () => {
    setBusy(true);
    setError('');
    setPreviewKey('');
    audio.current?.pause();
    try {
      const result = await previewClipEdit(clip.id, settings);
      setPending(result.renderToken);
      setDirty(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not generate preview',
      );
    } finally {
      setBusy(false);
    }
  };
  const save = async (isEnabled: boolean) => {
    if (!source?.renderToken || !previewReady) {
      return;
    }
    setBusy(true);
    setError('');
    audio.current?.pause();
    try {
      await applyClipEdit(clip.id, {
        ...placement,
        title,
        isEnabled,
        renderToken: source.renderToken,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save clip');
    } finally {
      if (alive.current) {
        setBusy(false);
      }
    }
  };
  const audioUrl =
    mode === 'processed' && previewReady
      ? source?.draftUrl
      : source?.originalUrl;

  return (
    <>
      <Dialog.Root
        isOpen
        onClose={() => {
          if (!busy) {
            if (dirty) {
              setDiscard(true);
            } else {
              onClose();
            }
          }
        }}
        className="max-w-3xl"
      >
        <Dialog.Title>Edit clip</Dialog.Title>
        {isForceMock() && (
          <p role="status" className="text-sm">
            Offline demo: processing is simulated. Preview plays the original
            audio.
          </p>
        )}
        <Dialog.Description>
          Trim, polish your voice, and choose where it plays in your 24/7
          rotation.
        </Dialog.Description>
        {loading ? (
          <p role="status">Loading audio…</p>
        ) : !source ? (
          <Button onClick={() => void load()}>Retry</Button>
        ) : (
          <div className="mt-4 flex flex-col gap-5">
            <section className="flex flex-col gap-3" aria-label="Audio">
              <h3 className="font-bold">1. Audio</h3>
              <Input
                label="Clip title"
                value={title}
                maxLength={120}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setDirty(true);
                }}
              />
              <WaveformSeekbar
                trackId={clip.id}
                peaks={peaks}
                progress={duration ? position / duration : 0}
                durationSec={duration}
                label="Clip waveform"
                markers={
                  duration
                    ? [
                        { fraction: settings.startSec / duration },
                        { fraction: settings.endSec / duration },
                      ]
                    : []
                }
                onSeek={(fraction) => {
                  if (audio.current) {
                    audio.current.currentTime =
                      mode === 'original'
                        ? fraction * duration
                        : Math.max(0, fraction * duration - settings.startSec);
                  }
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={mode === 'original' ? undefined : 'secondary'}
                  onClick={() => {
                    switchMode('original');
                  }}
                >
                  Original
                </Button>
                <Button
                  size="sm"
                  disabled={!previewReady}
                  variant={mode === 'processed' ? undefined : 'secondary'}
                  onClick={() => {
                    switchMode('processed');
                  }}
                >
                  Processed
                </Button>
                <Toggle
                  label="Loop selection"
                  showLabel
                  checked={loop}
                  onChange={setLoop}
                />
              </div>
              <audio
                key={audioUrl}
                ref={audio}
                src={audioUrl ?? undefined}
                controls
                aria-label={`${mode === 'original' ? 'Original' : 'Processed'} clip preview`}
                className="w-full"
                onLoadedMetadata={(e) => {
                  const mediaDuration = e.currentTarget.duration;
                  if (comparePosition.current !== null) {
                    e.currentTarget.currentTime = Math.max(
                      0,
                      Math.min(
                        e.currentTarget.duration,
                        comparePosition.current -
                          (mode === 'processed' ? settings.startSec : 0),
                      ),
                    );
                    comparePosition.current = null;
                  }
                  if (mode === 'original' && Number.isFinite(mediaDuration)) {
                    setDuration(mediaDuration);
                    setSettings((s) =>
                      s.endSec > 0 &&
                      (dirty || source.draftSettings || source.editorSettings)
                        ? s
                        : { ...s, endSec: mediaDuration },
                    );
                  }
                }}
                onPlay={(e) => {
                  if (
                    mode === 'original' &&
                    (e.currentTarget.currentTime < settings.startSec ||
                      e.currentTarget.currentTime >= settings.endSec)
                  ) {
                    e.currentTarget.currentTime = settings.startSec;
                  }
                }}
                onTimeUpdate={(e) => {
                  const player = e.currentTarget;
                  setPosition(
                    player.currentTime +
                      (mode === 'processed' ? settings.startSec : 0),
                  );
                  if (
                    mode === 'original' &&
                    player.currentTime >= settings.endSec
                  ) {
                    if (!loop) {
                      player.pause();
                    }
                    player.currentTime = settings.startSec;
                  }
                }}
                onEnded={(e) => {
                  if (loop) {
                    e.currentTarget.currentTime =
                      mode === 'original' ? settings.startSec : 0;
                    void e.currentTarget.play().catch(() => undefined);
                  }
                }}
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(
                  [
                    ['startSec', 'Start (s)'],
                    ['endSec', 'End (s)'],
                    ['fadeInSec', 'Fade in (s)'],
                    ['fadeOutSec', 'Fade out (s)'],
                  ] as const
                ).map(([key, label]) => (
                  <Input
                    key={key}
                    type="number"
                    inputMode="decimal"
                    enterKeyHint="done"
                    label={label}
                    min={0}
                    step={0.01}
                    value={settings[key]}
                    onChange={(e) =>
                      update({
                        [key]:
                          e.target.value === '' ? NaN : Number(e.target.value),
                      })
                    }
                  />
                ))}
              </div>
              {duration > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {(['startSec', 'endSec'] as const).map((key) => (
                    <label key={key} className="text-xs">
                      {key === 'startSec' ? 'Trim start' : 'Trim end'}
                      <input
                        className="w-full"
                        type="range"
                        min={0}
                        max={duration}
                        step={0.01}
                        value={
                          Number.isFinite(settings[key]) ? settings[key] : 0
                        }
                        onChange={(e) =>
                          update({ [key]: Number(e.target.value) })
                        }
                      />
                    </label>
                  ))}
                </div>
              )}
              <p className="text-foreground-secondary text-xs">
                Your original stays unchanged. Processed clips are saved as
                lossless WAV. A lossy original does not gain quality from
                editing.
              </p>
              <a
                href={source.originalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline"
              >
                Open original audio
              </a>
            </section>
            <section className="flex flex-col gap-3" aria-label="Voice sound">
              <h3 className="font-bold">2. Voice sound</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  'Original voice',
                  'Natural voice',
                  'Warm voice',
                  'Radio voice',
                ].map((preset) => (
                  <Button
                    key={preset}
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      update({
                        ...ORIGINAL_VOICE,
                        ...(preset !== 'Original voice'
                          ? {
                              removeRumble: true,
                              compress: true,
                              deEss: true,
                              normalize: true,
                            }
                          : {}),
                        warmth: preset === 'Warm voice',
                        clarity: preset === 'Radio voice',
                      })
                    }
                  >
                    {preset}
                  </Button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {effects.map(([key, label]) => (
                  <Toggle
                    key={key}
                    label={label}
                    showLabel
                    checked={settings[key]}
                    onChange={(value) => update({ [key]: value })}
                  />
                ))}
              </div>
              <p className="text-foreground-secondary text-xs">
                Match channel volume uses −14 LUFS with a −1.5 dB true-peak
                ceiling. Preview plays the final broadcast level.
              </p>
              {!valid && (
                <InlineError>
                  Choose a valid start and end within the original, with fades
                  that fit the selection (up to 30 seconds each).
                </InlineError>
              )}
              <Button
                disabled={!valid || busy || Boolean(pending)}
                onClick={() => void renderPreview()}
              >
                {pending
                  ? 'Rendering preview…'
                  : busy
                    ? 'Working…'
                    : 'Generate preview'}
              </Button>
              <p role="status" className="text-sm">
                {pending
                  ? 'Your current on-air clip is unchanged while this preview renders.'
                  : previewReady
                    ? 'Preview ready. Listen to Processed, then save.'
                    : 'Generate a preview to hear and save these changes.'}
              </p>
            </section>
            <section className="flex flex-col gap-3" aria-label="Placement">
              <h3 className="font-bold">3. When it plays</h3>
              <Select
                label="Placement"
                value={placement.placement}
                options={[
                  { id: 'BETWEEN', label: 'Between programs' },
                  { id: 'BEFORE', label: 'Before a program' },
                  { id: 'AFTER', label: 'After a program' },
                ]}
                onValueChange={(value) => {
                  setPlacement((p) => ({
                    ...p,
                    placement: value as ClipPlacement['placement'],
                  }));
                  setDirty(true);
                }}
              />
              {placement.placement === 'BETWEEN' ? (
                <>
                  <Select
                    label="Frequency"
                    value={placement.scheduleMode}
                    options={[
                      { id: 'AFTER_EVERY', label: 'After every program' },
                      { id: 'EVERY_NTH', label: 'Every N programs' },
                      { id: 'RANDOM', label: 'Occasionally (random)' },
                    ]}
                    onValueChange={(value) => {
                      setPlacement((p) => ({
                        ...p,
                        scheduleMode: value as ClipPlacement['scheduleMode'],
                      }));
                      setDirty(true);
                    }}
                  />
                  {placement.scheduleMode === 'EVERY_NTH' && (
                    <Input
                      label="Number of programs"
                      type="number"
                      inputMode="numeric"
                      enterKeyHint="done"
                      min={2}
                      max={100}
                      value={placement.everyNth ?? 3}
                      onChange={(e) => {
                        setPlacement((p) => ({
                          ...p,
                          everyNth: Number(e.target.value),
                        }));
                        setDirty(true);
                      }}
                    />
                  )}
                </>
              ) : (
                <Select
                  label="Program"
                  value={placement.targetSoundId ?? ''}
                  placeholder="Choose a program"
                  options={programs.map((p) => ({ id: p.id, label: p.title }))}
                  onValueChange={(value) => {
                    setPlacement((p) => ({ ...p, targetSoundId: value }));
                    setDirty(true);
                  }}
                />
              )}
              {missingTarget && (
                <InlineError>
                  Choose a program currently in your rotation.
                </InlineError>
              )}
              <p className="text-foreground-secondary text-xs">
                Programs are complete rotation items. Clips do not interrupt
                live shows. Enable “Play clips between programs” in 24/7
                settings to hear active clips. Changes are picked up when the
                station refreshes its rotation.
              </p>
            </section>
          </div>
        )}
        {error && <InlineError className="mt-3">{error}</InlineError>}
        <Dialog.Actions>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => (dirty ? setDiscard(true) : onClose())}
          >
            Close
          </Button>
          <Button
            variant="secondary"
            disabled={busy || !previewReady || missingTarget || !title.trim()}
            onClick={() => void save(false)}
          >
            Save inactive
          </Button>
          <Button
            disabled={busy || !previewReady || missingTarget || !title.trim()}
            onClick={() => void save(true)}
          >
            Save &amp; activate
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
      <ConfirmDialog
        isOpen={discard}
        title="Leave the clip editor?"
        description="Unsaved title and placement changes will be lost. A generated preview is retained for your next visit; your on-air clip stays unchanged."
        confirmLabel="Leave editor"
        onCancel={() => setDiscard(false)}
        onConfirm={onClose}
      />
    </>
  );
}
