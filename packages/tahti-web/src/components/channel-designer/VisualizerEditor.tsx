import { PauseIcon, PlayIcon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button, cn } from '@tahti-player/ui';

import {
  resolveVisualPresetSettings,
  VISUAL_PRESETS,
  type ColorScheme,
  type VisualPreset,
  type VisualSettingsMap,
} from '../../api/channel-design';
import { fetchEditorSource, fetchStudioSounds } from '../../api/studio';
import type { StudioSound } from '../../api/studio-types';
import { useAuthStore } from '../../stores/authStore';
import { usePlayerStore } from '../../stores/playerStore';
import { ChannelVisualizer } from '../ChannelVisualizer';
import { PlayerVisualizerControls } from './PlayerVisualizerControls';
import { TuningSliders } from './TuningSliders';
import { filterVisualizerEditorTracks } from './visualizerEditorTracks';
import { VisualizerPickerDialog } from './VisualizerPickerDialog';
import { VisualizerTrackPicker } from './VisualizerTrackPicker';

type ActivePreset = Exclude<VisualPreset, 'MINIMAL'>;

export type VisualizerEditorProps = {
  open: boolean;
  onClose: () => void;
  activeVisualizer: ActivePreset;
  visualizerEnabled: boolean;
  visualSettings: VisualSettingsMap;
  visualSettingsJson: string;
  scheme: ColorScheme;
  avatarUrl?: string | null;
  onApplyPreset: (preset: ActivePreset) => void;
  onToggleEnabled: () => void;
  onSettingChange: (
    preset: string,
    key: 'speed' | 'intensity' | 'audioReactive',
    value: number | boolean,
  ) => void;
};

function playableId(sound: StudioSound): string {
  return `sound:${sound.id}`;
}

/**
 * Channel & Design takeover: preview a Look’s visualizer against a library
 * track. Export-to-MP4 lands in Phase 2.
 */
export function VisualizerEditor({
  open,
  onClose,
  activeVisualizer,
  visualizerEnabled,
  visualSettings,
  visualSettingsJson,
  scheme,
  avatarUrl,
  onApplyPreset,
  onToggleEnabled,
  onSettingChange,
}: VisualizerEditorProps) {
  const user = useAuthStore((state) => state.user);
  const play = usePlayerStore((state) => state.play);
  const setStatus = usePlayerStore((state) => state.setStatus);
  const status = usePlayerStore((state) => state.status);
  const currentId = usePlayerStore((state) => state.currentId);

  const [tracks, setTracks] = useState<StudioSound[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [tracksError, setTracksError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playBusy, setPlayBusy] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPreset, setPickerPreset] =
    useState<ActivePreset>(activeVisualizer);

  const availableVisualizers = useMemo(
    () =>
      VISUAL_PRESETS.filter(
        (preset): preset is ActivePreset => preset !== 'MINIMAL',
      ),
    [],
  );

  const loadTracks = useCallback(() => {
    setTracksLoading(true);
    setTracksError(null);
    void fetchStudioSounds()
      .then((result) => {
        const next = filterVisualizerEditorTracks(result.data);
        setTracks(next);
        setSelectedId((current) => {
          if (current && next.some((track) => track.id === current)) {
            return current;
          }
          return next[0]?.id ?? null;
        });
      })
      .catch((error: unknown) => {
        setTracks([]);
        setTracksError(
          error instanceof Error ? error.message : 'Track list failed',
        );
      })
      .finally(() => setTracksLoading(false));
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    loadTracks();
    setPickerPreset(activeVisualizer);
    setShowSettings(true);
  }, [open, loadTracks, activeVisualizer]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pickerOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, pickerOpen]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const selectedTrack = tracks.find((track) => track.id === selectedId) ?? null;
  const playingThis =
    selectedTrack != null && currentId === playableId(selectedTrack);

  const playTrack = async (track: StudioSound) => {
    setSelectedId(track.id);
    if (currentId === playableId(track) && status === 'playing') {
      setStatus('paused');
      return;
    }
    if (currentId === playableId(track) && status === 'paused') {
      setStatus('playing');
      return;
    }
    setPlayBusy(true);
    try {
      const { data } = await fetchEditorSource(track.id);
      play({
        id: playableId(track),
        kind: 'sound',
        title: track.title,
        artist: track.artistName || user?.displayName || 'You',
        coverUrl: track.bannerUrl ?? undefined,
        streamUrl: data.url,
        protocol: data.url.includes('.m3u8') ? 'hls' : 'https',
      });
    } finally {
      setPlayBusy(false);
    }
  };

  const changeVisualizer = (direction: -1 | 1) => {
    const activeIndex = availableVisualizers.indexOf(activeVisualizer);
    const nextIndex =
      (activeIndex + direction + availableVisualizers.length) %
      availableVisualizers.length;
    const next = availableVisualizers[nextIndex];
    if (next) {
      onApplyPreset(next);
    }
  };

  const tuned = resolveVisualPresetSettings(visualSettings, activeVisualizer);
  const previewGradient = `linear-gradient(135deg, ${scheme.highlight ?? '#A78BFA'}, ${scheme.accent ?? '#22D3EE'}, ${scheme.bg ?? '#0B1220'})`;

  if (!open) {
    return null;
  }

  return (
    <div
      className="bg-background fixed inset-0 z-[70] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Visualization editor"
      data-testid="visualizer-editor"
    >
      <header className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="font-display truncate text-lg font-bold">
            Visualization editor
          </h2>
          <p className="text-foreground-secondary truncate text-xs">
            Preview your channel visualizer on a track. MP4 export comes next.
          </p>
        </div>
        <Button
          type="button"
          size="icon-sm"
          variant="text"
          aria-label="Close visualization editor"
          onClick={onClose}
        >
          <XIcon size={18} aria-hidden />
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="border-border flex w-full shrink-0 flex-col gap-4 overflow-y-auto border-b p-4 lg:w-96 lg:border-r lg:border-b-0">
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Track</h3>
            <VisualizerTrackPicker
              tracks={tracks}
              selectedId={selectedId}
              loading={tracksLoading}
              error={tracksError}
              onRetry={loadTracks}
              onSelect={(track) => void playTrack(track)}
              playingId={
                playingThis && status === 'playing' ? selectedId : null
              }
            />
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Visualizer</h3>
            <PlayerVisualizerControls
              activeVisualizer={activeVisualizer}
              visualizerEnabled={visualizerEnabled}
              showSettings={showSettings}
              tuningSlot={
                showSettings && visualizerEnabled ? (
                  <TuningSliders
                    preset={activeVisualizer}
                    visualSettings={visualSettings}
                    onSettingChange={onSettingChange}
                  />
                ) : undefined
              }
              onOpenPicker={() => {
                setPickerPreset(activeVisualizer);
                setPickerOpen(true);
              }}
              onPrevious={() => changeVisualizer(-1)}
              onNext={() => changeVisualizer(1)}
              onToggleSettings={() => setShowSettings((value) => !value)}
              onToggleEnabled={onToggleEnabled}
            />
          </section>
        </aside>

        <main className="relative min-h-0 min-w-0 flex-1 bg-black">
          <div
            className={cn(
              'absolute inset-0',
              !visualizerEnabled && 'opacity-40 grayscale',
            )}
          >
            {visualizerEnabled ? (
              <ChannelVisualizer
                preset={activeVisualizer}
                colorScheme={scheme}
                visualSettingsJson={visualSettingsJson}
                artworkUrl={selectedTrack?.bannerUrl}
                className="size-full"
                audioReactive={tuned.audioReactive}
              />
            ) : (
              <div
                className="size-full"
                style={{ background: previewGradient }}
                aria-hidden
              />
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="min-w-0 text-white">
              <p className="truncate text-sm font-semibold">
                {selectedTrack?.title ?? 'Pick a track'}
              </p>
              <p className="text-xs text-white/70">
                {selectedTrack
                  ? selectedTrack.artistName || user?.displayName || 'You'
                  : 'Library sounds appear on the left'}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={!selectedTrack || playBusy}
              aria-label={
                playingThis && status === 'playing'
                  ? 'Pause track'
                  : 'Play track'
              }
              onClick={() => {
                if (selectedTrack) {
                  void playTrack(selectedTrack);
                }
              }}
            >
              {playingThis && status === 'playing' ? (
                <PauseIcon size={16} aria-hidden />
              ) : (
                <PlayIcon size={16} aria-hidden />
              )}
              <span className="ml-2">
                {playingThis && status === 'playing' ? 'Pause' : 'Play'}
              </span>
            </Button>
          </div>
        </main>
      </div>

      <VisualizerPickerDialog
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        availableVisualizers={availableVisualizers}
        selectedPreset={pickerPreset}
        onSelectPreset={setPickerPreset}
        onConfirm={() => {
          onApplyPreset(pickerPreset);
          setPickerOpen(false);
        }}
        livePreview
        scheme={scheme}
        visualSettingsJson={visualSettingsJson}
        avatarUrl={avatarUrl}
        previewGradient={previewGradient}
      />
    </div>
  );
}
