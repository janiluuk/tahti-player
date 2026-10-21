import { useEffect, useState, useSyncExternalStore } from 'react';

import { useThemeStore } from '../plugins/themes';
import { useAmbientStore } from '../stores/ambientStore';
import { ChannelVisualizer } from './ChannelVisualizer';
import { isThemeVisualizationEnabled } from './ThemeVisualizationSettings';

export const AMBIENT_SCHEME = {
  accent: '#22D3EE',
  highlight: '#A78BFA',
  bg: '#0A0E1A',
  text: '#F8FAFC',
  muted: '#64748B',
};

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function reducedMotionQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return null;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY);
}

function subscribeReducedMotion(onChange: () => void): () => void {
  const mql = reducedMotionQuery();
  if (!mql) {
    return () => undefined;
  }
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function prefersReducedMotion(): boolean {
  return reducedMotionQuery()?.matches ?? false;
}

function useDocumentHidden(): boolean {
  const [hidden, setHidden] = useState(
    () => typeof document !== 'undefined' && document.hidden,
  );

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return hidden;
}

export function AmbientBackground() {
  const enabled = useAmbientStore((state) => state.enabled);
  const preset = useAmbientStore((state) => state.preset);
  const opacity = useAmbientStore((state) => state.opacity);
  const speed = useAmbientStore((state) => state.speed);
  const intensity = useAmbientStore((state) => state.intensity);
  const audioReactive = useAmbientStore((state) => state.audioReactive);
  const themeId = useThemeStore((state) => state.themeId);
  const pageHidden = useDocumentHidden();
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    prefersReducedMotion,
    () => false,
  );

  if (!enabled || !isThemeVisualizationEnabled(themeId)) {
    return null;
  }

  const paused = pageHidden || reducedMotion;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 mix-blend-screen"
      style={{ opacity }}
      aria-hidden
      data-ambient-background
      data-ambient-paused={paused || undefined}
    >
      {paused ? (
        <div
          className="h-full w-full"
          style={{
            background: `radial-gradient(ellipse at 30% 20%, ${AMBIENT_SCHEME.highlight}55, transparent 55%), radial-gradient(ellipse at 70% 80%, ${AMBIENT_SCHEME.accent}33, ${AMBIENT_SCHEME.bg})`,
          }}
        />
      ) : (
        <ChannelVisualizer
          preset={preset}
          colorScheme={AMBIENT_SCHEME}
          visualSettingsJson={`{"${preset}":{"speed":${speed},"intensity":${intensity}}}`}
          audioReactive={audioReactive}
          className="h-full w-full"
        />
      )}
    </div>
  );
}
