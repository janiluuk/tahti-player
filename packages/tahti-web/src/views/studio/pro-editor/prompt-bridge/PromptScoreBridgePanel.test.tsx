import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PromptScoreBridgePanel } from './PromptScoreBridgePanel';
import { smf } from './smfFixture';

function drop(bytes: Uint8Array, name: string) {
  const file = new File([bytes], name, { type: 'audio/midi' });
  // jsdom's File has no arrayBuffer(); browsers do.
  Object.defineProperty(file, 'arrayBuffer', {
    value: async () => bytes.slice().buffer,
  });
  fireEvent.change(screen.getByLabelText('MIDI phrase'), {
    target: { files: [file] },
  });
}

describe('PromptScoreBridgePanel', () => {
  it('describes a dropped MIDI phrase and fills the prompt snippet', async () => {
    render(<PromptScoreBridgePanel />);
    drop(
      smf({
        bpm: 120,
        key: { sharps: 1, minor: true },
        pitches: [64, 67, 71, 72, 71, 67, 64, 62],
      }),
      'riff.mid',
    );

    expect(
      await screen.findByText("Key: E minor (from the file's key signature)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Tempo: 120 BPM (from the file)'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Prompt snippet')).toHaveValue(
      'melody in E minor, 120 BPM, mid register (D4-C5), arch-shaped line with a mix of steps and leaps, moderate rhythm, 2-bar phrase',
    );
    expect(screen.getByText('riff.mid')).toBeInTheDocument();
  });

  it('shows an error for a file that is not MIDI', async () => {
    render(<PromptScoreBridgePanel />);
    drop(new Uint8Array([0, 1, 2, 3]), 'notes.mid');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This file could not be read as MIDI.',
    );
    expect(screen.queryByLabelText('Prompt snippet')).not.toBeInTheDocument();
  });
});
