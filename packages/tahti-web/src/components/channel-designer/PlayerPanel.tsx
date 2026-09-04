import type { ReactNode } from 'react';

import { Tabs } from '@tahti-player/ui';

import { BRAND_ACCENTS, type ColorScheme } from '../../api/channel-design';
import { PlayerGradientControls } from './PlayerGradientControls';

export type PlayerDesignTab =
  | 'gradient'
  | 'video-image'
  | 'visualizer'
  | 'overlay';

const TAB_ORDER: PlayerDesignTab[] = [
  'gradient',
  'video-image',
  'visualizer',
  'overlay',
];

type Props = {
  tab: PlayerDesignTab;
  onTabChange: (tab: PlayerDesignTab) => void;
  usePlayerGradient: boolean;
  playerScheme: ColorScheme;
  onUsePlayerGradient: (enabled: boolean) => void;
  onPlayerSchemeChange: (next: ColorScheme) => void;
  onPlayerBrandAccent: (brand: (typeof BRAND_ACCENTS)[number]) => void;
  /** Header video / image picker (owned by ChannelDesigner). */
  videoSlot: ReactNode;
  /** Visualizer picker + tuning (owned by ChannelDesigner). */
  visualizerSlot: ReactNode;
  /** Stage overlay + now-playing presets. */
  overlaySlot: ReactNode;
  /** Optional block below tabs (e.g. channel text overlay). */
  footerSlot?: ReactNode;
};

/**
 * Look → Player panel: Gradient / Video / Visualizer / Overlay tabs.
 * Heavy upload and visualizer chrome stay in slots from ChannelDesigner.
 */
export function PlayerPanel({
  tab,
  onTabChange,
  usePlayerGradient,
  playerScheme,
  onUsePlayerGradient,
  onPlayerSchemeChange,
  onPlayerBrandAccent,
  videoSlot,
  visualizerSlot,
  overlaySlot,
  footerSlot,
}: Props) {
  const selectedIndex = Math.max(0, TAB_ORDER.indexOf(tab));

  return (
    <div
      id="channel-designer-section-player"
      className="flex flex-col"
      data-testid="channel-player-panel"
    >
      <Tabs
        listClassName="flex-wrap border-border border-b pb-3"
        panelClassName="pt-2"
        selectedIndex={selectedIndex}
        onChange={(index) => {
          onTabChange(TAB_ORDER[index] ?? 'gradient');
        }}
        items={[
          {
            id: 'gradient',
            label: 'Gradient',
            content: (
              <PlayerGradientControls
                usePlayerGradient={usePlayerGradient}
                playerScheme={playerScheme}
                onUsePlayerGradient={onUsePlayerGradient}
                onPlayerSchemeChange={onPlayerSchemeChange}
                onPlayerBrandAccent={onPlayerBrandAccent}
              />
            ),
          },
          {
            id: 'video-image',
            label: 'Video / image',
            content: (
              <div className="flex flex-col gap-3">
                <p className="text-foreground-secondary text-xs">
                  Use a looping video or still image behind the channel header.
                </p>
                {videoSlot}
              </div>
            ),
          },
          {
            id: 'visualizer',
            label: 'Visualizer',
            content: visualizerSlot,
          },
          {
            id: 'overlay',
            label: 'Overlay',
            content: overlaySlot,
          },
        ]}
      />
      {footerSlot ? <div className="mt-5">{footerSlot}</div> : null}
    </div>
  );
}
