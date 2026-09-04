import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ColorScheme } from '@tahti-web/api/channel-design';
import {
  PlayerPanel,
  type PlayerDesignTab,
} from '@tahti-web/components/channel-designer/PlayerPanel';
import { useState } from 'react';

/**
 * Look → Player panel. Gradient tab is fully interactive; other tabs use
 * slot mocks so uploads / visualizer / overlay can be corrected separately.
 *
 * Missing states: live visualizer PluginItem, now-playing overlay grid,
 * video upload progress.
 */
const meta: Meta<typeof PlayerPanel> = {
  title: 'Tahti/Channel/Designer/PlayerPanel',
  component: PlayerPanel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const initialScheme: ColorScheme = {
  accent: '#22D3EE',
  highlight: '#A78BFA',
  bg: '#0B1220',
  text: '#F8FAFC',
  muted: '#64748B',
};

function Demo({ initialTab }: { initialTab: PlayerDesignTab }) {
  const [tab, setTab] = useState<PlayerDesignTab>(initialTab);
  const [usePlayerGradient, setUsePlayerGradient] = useState(
    initialTab === 'gradient',
  );
  const [playerScheme, setPlayerScheme] = useState<ColorScheme>(initialScheme);

  return (
    <div className="border-border bg-background/80 max-w-md rounded-xl border p-3 backdrop-blur-md">
      <PlayerPanel
        tab={tab}
        onTabChange={setTab}
        usePlayerGradient={usePlayerGradient}
        playerScheme={playerScheme}
        onUsePlayerGradient={setUsePlayerGradient}
        onPlayerSchemeChange={setPlayerScheme}
        onPlayerBrandAccent={(brand) =>
          setPlayerScheme((current) => ({
            ...current,
            accent: brand.accent,
            highlight: brand.highlight,
          }))
        }
        videoSlot={
          <p className="text-foreground-secondary text-xs">
            Video / image upload slot (mock).
          </p>
        }
        visualizerSlot={
          <p className="text-foreground-secondary text-xs">
            Visualizer picker + tuning slot (mock).
          </p>
        }
        overlaySlot={
          <p className="text-foreground-secondary text-xs">
            Stage overlay + now-playing presets slot (mock).
          </p>
        }
        footerSlot={
          <p className="text-foreground-secondary text-xs">
            Channel text overlay footer (mock).
          </p>
        }
      />
    </div>
  );
}

export const Gradient: Story = {
  render: () => <Demo initialTab="gradient" />,
};

export const VideoImage: Story = {
  name: 'Video / image',
  render: () => <Demo initialTab="video-image" />,
};

export const Visualizer: Story = {
  render: () => <Demo initialTab="visualizer" />,
};

export const Overlay: Story = {
  render: () => <Demo initialTab="overlay" />,
};
