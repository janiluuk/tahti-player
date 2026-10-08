import type { Meta, StoryObj } from '@storybook/react-vite';
import { VisualizerExportPanel } from '@tahti-web/components/channel-designer/VisualizerExportPanel';
import { useState } from 'react';

/**
 * Export controls for the visualization editor.
 *
 * Missing states: live MediaRecorder progress against a real canvas (needs
 * browser media APIs in Storybook play).
 */
const meta: Meta<typeof VisualizerExportPanel> = {
  title: 'Tahti/Studio/VisualizerEditor/ExportPanel',
  component: VisualizerExportPanel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function Demo({
  exporting = false,
  withResult = false,
  overLimit = false,
}: {
  exporting?: boolean;
  withResult?: boolean;
  overLimit?: boolean;
}) {
  const [durationSec, setDurationSec] = useState<5 | 10 | 15>(10);
  const [resolutionId, setResolutionId] = useState<'720' | '480'>('720');
  const resultFile = withResult
    ? new File(
        [new Uint8Array(overLimit ? 11 * 1024 * 1024 : 1_200_000)],
        overLimit ? 'too-big.webm' : 'tahti-visualizer.webm',
        { type: 'video/webm' },
      )
    : null;

  return (
    <div className="max-w-md">
      <VisualizerExportPanel
        durationSec={durationSec}
        resolutionId={resolutionId}
        exporting={exporting}
        progress={exporting ? 0.42 : withResult ? 1 : 0}
        error={null}
        resultFile={resultFile}
        onDurationChange={setDurationSec}
        onResolutionChange={setResolutionId}
        onStart={() => undefined}
        onCancel={() => undefined}
        onUseAsBackground={() => undefined}
        onDownload={() => undefined}
      />
    </div>
  );
}

export const Idle: Story = {
  render: () => <Demo />,
};

export const Exporting: Story = {
  render: () => <Demo exporting />,
};

export const Ready: Story = {
  name: 'Ready to apply',
  render: () => <Demo withResult />,
};

export const TooLarge: Story = {
  name: 'Over upload limit',
  render: () => <Demo withResult overLimit />,
};
