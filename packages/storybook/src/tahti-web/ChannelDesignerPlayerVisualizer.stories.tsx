import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlayerVisualizerControls } from '@tahti-web/components/channel-designer/PlayerVisualizerControls';
import { useState } from 'react';

/**
 * Player → Visualizer chrome. Tuning slot is optional; picker dialog stays
 * in ChannelDesigner.
 *
 * Missing states: every VISUAL_PRESETS icon, docked tuning with live sliders.
 */
const meta: Meta<typeof PlayerVisualizerControls> = {
  title: 'Tahti/Channel/Designer/PlayerVisualizerControls',
  component: PlayerVisualizerControls,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function Demo({
  enabled = true,
  withTuning = false,
}: {
  enabled?: boolean;
  withTuning?: boolean;
}) {
  const [visualizerEnabled, setVisualizerEnabled] = useState(enabled);
  const [showSettings, setShowSettings] = useState(withTuning);
  return (
    <div className="max-w-lg">
      <PlayerVisualizerControls
        activeVisualizer="AURORA"
        visualizerEnabled={visualizerEnabled}
        showSettings={showSettings}
        tuningSlot={
          showSettings && visualizerEnabled ? (
            <p className="text-foreground-secondary text-xs">
              Tuning sliders slot (mock).
            </p>
          ) : undefined
        }
        onOpenPicker={() => undefined}
        onPrevious={() => undefined}
        onNext={() => undefined}
        onToggleSettings={() => setShowSettings((value) => !value)}
        onToggleEnabled={() => setVisualizerEnabled((value) => !value)}
      />
    </div>
  );
}

export const Enabled: Story = {
  render: () => <Demo />,
};

export const Disabled: Story = {
  render: () => <Demo enabled={false} />,
};

export const WithTuning: Story = {
  name: 'Settings open + tuning slot',
  render: () => <Demo withTuning />,
};
