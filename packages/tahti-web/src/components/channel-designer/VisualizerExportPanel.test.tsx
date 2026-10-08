import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { VisualizerExportPanel } from './VisualizerExportPanel';

describe('VisualizerExportPanel', () => {
  it('starts an export', () => {
    const onStart = vi.fn();
    render(
      <VisualizerExportPanel
        durationSec={10}
        resolutionId="720"
        exporting={false}
        progress={0}
        error={null}
        resultFile={null}
        onDurationChange={() => undefined}
        onResolutionChange={() => undefined}
        onStart={onStart}
        onCancel={() => undefined}
        onUseAsBackground={() => undefined}
        onDownload={() => undefined}
      />,
    );
    fireEvent.click(screen.getByTestId('visualizer-export-start'));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('offers use-as-background when a file is ready', () => {
    const onUse = vi.fn();
    const file = new File([new Uint8Array(1000)], 'clip.webm', {
      type: 'video/webm',
    });
    render(
      <VisualizerExportPanel
        durationSec={10}
        resolutionId="720"
        exporting={false}
        progress={1}
        error={null}
        resultFile={file}
        onDurationChange={() => undefined}
        onResolutionChange={() => undefined}
        onStart={() => undefined}
        onCancel={() => undefined}
        onUseAsBackground={onUse}
        onDownload={() => undefined}
      />,
    );
    fireEvent.click(screen.getByTestId('visualizer-use-as-background'));
    expect(onUse).toHaveBeenCalledOnce();
  });
});
