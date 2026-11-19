import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { WaveformEditor } from './WaveformEditor';

const toastError = vi.fn();

vi.mock('sonner', () => ({
  toast: { error: (...args: unknown[]) => toastError(...args) },
}));

vi.mock('../../../lib/audioPreviewGraph', () => ({
  useAudioPreviewGraph: () => ({ effectsBlocked: false }),
}));

vi.mock('./waveform/useWaveformData', () => ({
  useWaveformData: () => ({
    data: null,
    status: 'idle',
    localUrl: null,
    zeroCrossings: [],
  }),
}));

vi.mock('./waveform/EditorWaveSurfer', () => ({
  EditorWaveSurfer: ({ onFallback }: { onFallback?: () => void }) => {
    onFallback?.();
    return <div data-testid="editor-wavesurfer" />;
  },
}));

describe('WaveformEditor', () => {
  it('keeps wavesurfer mounted and toasts when initialisation fails', async () => {
    render(
      <WaveformEditor
        sourceUrl={null}
        serverPeaks={null}
        editList={{ sourceDuration: 60, cuts: [], fades: [], markers: [] }}
        onChange={vi.fn()}
        onDuration={vi.fn()}
        canUndo={false}
        canRedo={false}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
      />,
    );

    expect(screen.getByTestId('editor-wavesurfer')).toBeInTheDocument();
    expect(screen.queryByTestId('editor-basic-waveform')).toBeNull();
    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
