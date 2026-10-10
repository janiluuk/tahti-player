import type { Meta, StoryObj } from '@storybook/react-vite';
import type { PhraseNote } from '@tahti-web/views/studio/pro-editor/prompt-bridge/phraseAnalysis';
import { PromptScoreBridgePanel } from '@tahti-web/views/studio/pro-editor/prompt-bridge/PromptScoreBridgePanel';
import { expect, within } from 'storybook/test';

function line(pitches: number[], beatsEach: number): PhraseNote[] {
  return pitches.map((midi, i) => ({
    midi,
    startBeat: i * beatsEach,
    durationBeats: beatsEach,
    velocity: 0.8,
  }));
}

const meta: Meta<typeof PromptScoreBridgePanel> = {
  title: 'Tahti/Studio/PromptScoreBridgePanel',
  component: PromptScoreBridgePanel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText('MIDI phrase')).toBeInTheDocument();
    await expect(canvas.queryByText('Prompt snippet')).not.toBeInTheDocument();
  },
};

export const MajorArch: Story = {
  args: {
    initial: {
      fileName: 'hook-idea.mid',
      phrase: {
        bpm: 100,
        notes: line(
          [60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60],
          1,
        ),
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText('Range: C4 to C5 (12 semitones, mid register)'),
    ).toBeInTheDocument();
    await expect(canvas.getByLabelText('Prompt snippet')).toHaveValue(
      'melody in C major, 100 BPM, mid register (C4-C5), stepwise arch-shaped line, moderate rhythm, 4-bar phrase',
    );
  },
};

export const MinorWithKeySignature: Story = {
  args: {
    initial: {
      fileName: 'verse-lead.mid',
      phrase: {
        bpm: 84,
        beatsPerBar: 3,
        keySignature: { tonic: 'D', mode: 'minor' },
        notes: line([62, 65, 69, 74, 72, 70, 69, 65, 64, 62, 57, 62], 0.5),
      },
    },
  },
};
