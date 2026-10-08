import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PlayerVisualizerControls } from './PlayerVisualizerControls';

describe('PlayerVisualizerControls', () => {
  it('opens the visualization editor when the CTA is provided', () => {
    const onOpenEditor = vi.fn();
    render(
      <PlayerVisualizerControls
        activeVisualizer="AURORA"
        visualizerEnabled
        showSettings={false}
        onOpenPicker={() => undefined}
        onPrevious={() => undefined}
        onNext={() => undefined}
        onToggleSettings={() => undefined}
        onToggleEnabled={() => undefined}
        onOpenEditor={onOpenEditor}
      />,
    );
    fireEvent.click(screen.getByTestId('open-visualization-editor'));
    expect(onOpenEditor).toHaveBeenCalledOnce();
  });

  it('hides the editor CTA when no handler is passed', () => {
    render(
      <PlayerVisualizerControls
        activeVisualizer="AURORA"
        visualizerEnabled
        showSettings={false}
        onOpenPicker={() => undefined}
        onPrevious={() => undefined}
        onNext={() => undefined}
        onToggleSettings={() => undefined}
        onToggleEnabled={() => undefined}
      />,
    );
    expect(
      screen.queryByTestId('open-visualization-editor'),
    ).not.toBeInTheDocument();
  });
});
