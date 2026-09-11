import { lazy, Suspense, useEffect, useMemo, useState } from 'react';

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

export const ChannelVisualizer = ({
  preset,
  colorScheme,
  colorSchemeJson,
  visualSettingsJson,
  settings: settingsOverride,
  className,
  artworkUrl,
  audioReactive,
}: Props) => {
  const [canAnimate, setCanAnimate] = useState(false);
  const mode = (preset ?? 'AURORA').toUpperCase();
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
