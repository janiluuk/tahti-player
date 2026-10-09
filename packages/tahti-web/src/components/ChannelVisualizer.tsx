import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';

import {
  isAdvancedMode,
  isCymaticsMode,
  VisualizerHost,
  type VisualizerMode,
} from '@tahti-player/visualizer';

import {
  channelVizPackFromJson,
  vizPackModeAt,
  type ChannelVizPack,
} from '../lib/channelVizPacks';
import { supportsWebGL } from '../lib/webgl';
import type { ThreeVisualizerProps } from './visuals/ThreeVisualizer';

export type VisualColorScheme = {
  accent?: string;
  highlight?: string;
  bg?: string;
  text?: string;
  muted?: string;
};

type Props = {
  preset?: string | null;
  colorScheme?: VisualColorScheme | null;
  colorSchemeJson?: string | null;
  visualSettingsJson?: string | null;
  settings?: ThreeVisualizerProps['settings'];
  className?: string;
  artworkUrl?: string | null;
  audioReactive?: boolean;
  /** Prefer theDAW-ported Advanced/Cymatics modes when the preset matches.
   * Without one, a viz pack saved in `visualSettingsJson` picks the mode. */
  engineMode?: VisualizerMode | null;
  /** When true, show VisualizerHost mode picker (e.g. fullscreen player). */
  showModePicker?: boolean;
  onEngineModeChange?: (mode: VisualizerMode) => void;
};

const ThreeVisualizer = lazy(() =>
  import('./visuals/ThreeVisualizer').then((module) => ({
    default: module.ThreeVisualizer,
  })),
);

const DEFAULT_SCHEME: Required<VisualColorScheme> = {
  accent: '#22D3EE',
  highlight: '#A78BFA',
  bg: '#0B1220',
  text: '#F8FAFC',
  muted: '#64748B',
};

const DEFAULT_SETTINGS = {
  speed: 1,
  intensity: 1,
  scale: 1,
  audioReactive: true,
};

function parseJson<T>(json: string | null | undefined): Partial<T> {
  if (!json) {
    return {};
  }

  try {
    return JSON.parse(json) as Partial<T>;
  } catch {
    return {};
  }
}

type LooseScheme = VisualColorScheme & {
  background?: string;
  foreground?: string;
};

function parseScheme(
  scheme: LooseScheme | null | undefined,
  json: string | null | undefined,
): Required<VisualColorScheme> {
  const parsed = parseJson<LooseScheme>(json);

  return {
    accent: scheme?.accent ?? parsed.accent ?? DEFAULT_SCHEME.accent,
    highlight:
      scheme?.highlight ?? parsed.highlight ?? DEFAULT_SCHEME.highlight,
    bg:
      scheme?.bg ??
      scheme?.background ??
      parsed.bg ??
      parsed.background ??
      DEFAULT_SCHEME.bg,
    text:
      scheme?.text ??
      scheme?.foreground ??
      parsed.text ??
      parsed.foreground ??
      DEFAULT_SCHEME.text,
    muted: scheme?.muted ?? parsed.muted ?? DEFAULT_SCHEME.muted,
  };
}

type StoredPresetSettings = {
  speed?: number;
  intensity?: number;
  scale?: number;
  audioReactive?: boolean;
};

function parseSettings(
  json: string | null | undefined,
  preset: string,
): ThreeVisualizerProps['settings'] {
  const parsed = parseJson<Record<string, StoredPresetSettings>>(json);
  const settings = parsed[preset];

  return {
    speed: settings?.speed ?? DEFAULT_SETTINGS.speed,
    intensity: settings?.intensity ?? DEFAULT_SETTINGS.intensity,
    scale: settings?.scale ?? DEFAULT_SETTINGS.scale,
  };
}

function parseStoredAudioReactive(
  json: string | null | undefined,
  preset: string,
): boolean {
  const parsed = parseJson<Record<string, StoredPresetSettings>>(json);
  return parsed[preset]?.audioReactive ?? DEFAULT_SETTINGS.audioReactive;
}

function resolveEngineMode(
  engineMode: VisualizerMode | null | undefined,
  preset: string,
): VisualizerMode | null {
  if (
    engineMode &&
    (isAdvancedMode(engineMode) || isCymaticsMode(engineMode))
  ) {
    return engineMode;
  }
  const lower = preset.toLowerCase();
  if (
    isAdvancedMode(lower as VisualizerMode) ||
    isCymaticsMode(lower as VisualizerMode)
  ) {
    return lower as VisualizerMode;
  }
  return null;
}

function useVizPackMode(pack: ChannelVizPack | null): VisualizerMode | null {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    setElapsedMs(0);
    if (!pack || pack.modes.length < 2) {
      return;
    }
    const startedAt = Date.now();
    const id = window.setInterval(
      () => setElapsedMs(Date.now() - startedAt),
      pack.rotateSeconds * 1000,
    );
    return () => window.clearInterval(id);
  }, [pack]);

  return pack ? vizPackModeAt(pack, elapsedMs) : null;
}

export const ChannelVisualizer = ({
  preset,
  colorScheme,
  colorSchemeJson,
  visualSettingsJson,
  settings: settingsOverride,
  className,
  artworkUrl,
  audioReactive,
  engineMode,
  showModePicker = false,
  onEngineModeChange,
}: Props) => {
  const [canAnimate, setCanAnimate] = useState(false);
  const [offscreen, setOffscreen] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mode = (preset ?? 'AURORA').toUpperCase();
  const pack = useMemo(
    () => (engineMode ? null : channelVizPackFromJson(visualSettingsJson)),
    [engineMode, visualSettingsJson],
  );
  const packMode = useVizPackMode(pack);
  const portedMode = resolveEngineMode(engineMode ?? packMode, preset ?? '');
  const scheme = useMemo(
    () => parseScheme(colorScheme, colorSchemeJson),
    [colorScheme, colorSchemeJson],
  );
  const settings = useMemo(
    () => parseSettings(visualSettingsJson, mode),
    [mode, visualSettingsJson],
  );
  // A caller passing `audioReactive` explicitly (the global ambient
  // background's own on/off switch, unrelated to any one preset's saved
  // settings) always wins; otherwise fall back to this preset's own
  // persisted toggle, defaulting on.
  const resolvedAudioReactive =
    audioReactive ?? parseStoredAudioReactive(visualSettingsJson, mode);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    setCanAnimate(!reducedMotion && mode !== 'MINIMAL' && supportsWebGL());
  }, [mode]);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setOffscreen(!entry.isIntersecting);
        }
      },
      { rootMargin: '80px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [portedMode]);

  const fallback = (
    <div
      className={className}
      aria-hidden
      style={{
        background: `radial-gradient(ellipse at 30% 20%, ${scheme.highlight}55, transparent 55%), radial-gradient(ellipse at 70% 80%, ${scheme.accent}33, ${scheme.bg})`,
      }}
    />
  );

  if (!canAnimate) {
    return fallback;
  }

  if (portedMode) {
    return (
      <div ref={hostRef} className={className}>
        <VisualizerHost
          mode={portedMode}
          showModePicker={showModePicker}
          onModeChange={onEngineModeChange}
          suspended={offscreen || !resolvedAudioReactive}
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <Suspense fallback={fallback}>
      <ThreeVisualizer
        className={className}
        preset={mode}
        scheme={scheme}
        settings={settingsOverride ?? settings}
        artworkUrl={artworkUrl}
        audioReactive={resolvedAudioReactive}
      />
    </Suspense>
  );
};
