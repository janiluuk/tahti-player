import { useThemeStore } from '../plugins/themes';
import { AMBIENT_SCHEME } from './AmbientBackground';
import { ChannelVisualizer } from './ChannelVisualizer';
import { isThemeVisualizationEnabled } from './ThemeVisualizationSettings';

/** Quiet gateway ambience behind Discover — mirrors apps/web's BgCanvas
 * `subtle` role without requiring the global Settings ambient toggle. */
export function DiscoverGatewayBackground() {
  const themeId = useThemeStore((state) => state.themeId);

  if (!isThemeVisualizationEnabled(themeId)) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden mix-blend-screen"
      style={{ opacity: 0.14 }}
      aria-hidden
      data-discover-gateway-background
    >
      <ChannelVisualizer
        preset="AURORA"
        colorScheme={AMBIENT_SCHEME}
        visualSettingsJson='{"AURORA":{"speed":0.1,"intensity":0.45}}'
        audioReactive={false}
        className="h-full w-full"
      />
    </div>
  );
}
