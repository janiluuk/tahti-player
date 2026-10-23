import { render, screen } from '@testing-library/react';
import { forwardRef, useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { WaveformEditor } from './WaveformEditor';

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
    useEffect(() => {
      onFallback?.();
    }, [onFallback]);
    return <div data-testid="editor-wavesurfer" />;
  },
}));

vi.mock('./waveform/ProWaveform', () => ({
  ProWaveform: forwardRef(function ProWaveform() {
    return <div data-testid="pro-waveform" />;
  }),
}));

vi.mock('./waveform/ProMinimap', () => ({
  ProMinimap: forwardRef(function ProMinimap() {
    return <div data-testid="pro-minimap" />;
  }),
}));

describe('WaveformEditor', () => {
  it('says so when it falls back to the basic waveform', async () => {
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

    expect(await screen.findByTestId('pro-waveform')).toBeInTheDocument();
    expect(screen.getByTestId('editor-basic-waveform')).toHaveTextContent(
      'Showing the basic waveform',
    );
    expect(screen.queryByTestId('editor-wavesurfer')).toBeNull();
  });
});
