import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState, type ReactNode } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import {
  createMidiClip,
  MidiClipPanel,
  PianoRoll,
  useEditorStore,
  type PianoNote,
  type PianoRollProps,
} from '@tahti-player/audio-editor';

const HOOK: PianoNote[] = [
  { id: 'n1', pitch: 60, start: 0, duration: 1, velocity: 110 },
  { id: 'n2', pitch: 64, start: 1, duration: 0.5, velocity: 90 },
  { id: 'n3', pitch: 67, start: 1.5, duration: 0.5, velocity: 90 },
  { id: 'n4', pitch: 72, start: 2, duration: 2, velocity: 120 },
  { id: 'n5', pitch: 67, start: 4.25, duration: 0.75, velocity: 80 },
  { id: 'n6', pitch: 65, start: 5.1, duration: 0.9, velocity: 80 },
  { id: 'n7', pitch: 64, start: 6, duration: 2, velocity: 100 },
];

function StatefulRoll(
  props: Omit<PianoRollProps, 'onChange' | 'selectedId' | 'onSelect'>,
) {
  const [notes, setNotes] = useState(props.notes);
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <PianoRoll
        {...props}
        notes={notes}
        onChange={setNotes}
        selectedId={selected}
        onSelect={setSelected}
      />
      <p
        className="text-foreground-secondary font-mono text-xs"
        data-testid="note-count"
      >
        {notes.length} notes
      </p>
    </div>
  );
}

const meta = {
  title: 'Audio/PianoRoll',
  component: StatefulRoll,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="bg-background text-foreground w-full max-w-5xl">
        <Story />
      </div>
    ),
  ],
  args: {
    notes: HOOK,
    lengthBeats: 8,
    gridBeats: 0.25,
    lowPitch: 55,
    highPitch: 79,
  },
} satisfies Meta<typeof StatefulRoll>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sketch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const notes = canvas.getAllByRole('gridcell');
    await expect(notes).toHaveLength(HOOK.length);
    await userEvent.click(
      canvas.getByRole('gridcell', { name: /^C5 at beat 3/ }),
    );
    await userEvent.keyboard('{Delete}');
    await expect(canvas.getByTestId('note-count')).toHaveTextContent(
      `${HOOK.length - 1} notes`,
    );
  },
};

export const Empty: Story = {
  args: { notes: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole('grid');
    await userEvent.pointer({
      target: grid,
      keys: '[MouseLeft>]',
      coords: {
        x: grid.getBoundingClientRect().left + 5,
        y: grid.getBoundingClientRect().top + 5,
      },
    });
    await expect(canvas.getAllByRole('gridcell')).toHaveLength(1);
  },
};

export const Narrow: Story = {
  args: { lengthBeats: 16, gridBeats: 0.5 },
  decorators: [
    (Story) => (
      <div className="max-w-[358px]">
        <Story />
      </div>
    ),
  ],
};

function SeedMidiClip({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const store = useEditorStore.getState();
    store.loadProject({ tracks: [], clips: [] });
    const trackId = useEditorStore.getState().addTrack({ name: 'Keys' });
    const id = useEditorStore.getState().addClipToTrack(
      createMidiClip({
        trackId,
        startSec: 0,
        bpm: 120,
        notes: HOOK,
        label: 'Hook',
      }),
    );
    useEditorStore.getState().setSelected(id);
    setReady(true);
  }, []);
  return ready ? <>{children}</> : null;
}

export const ClipPanel: StoryObj = {
  render: () => {
    const id = useEditorStore.getState().selectedClipId;
    return id ? <MidiClipPanel clipId={id} /> : <p>No clip</p>;
  },
  decorators: [
    (Story) => (
      <SeedMidiClip>
        <Story />
      </SeedMidiClip>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('button', { name: /Bounce clip to audio/ }),
    ).toBeEnabled();
    await userEvent.click(canvas.getByRole('button', { name: /Quantize/ }));
    const quantized = useEditorStore.getState().clips[0]?.sourcePianoRoll ?? [];
    await expect(quantized.find((n) => n.id === 'n6')?.start).toBe(5);
  },
};
