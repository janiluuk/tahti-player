import { afterEach, describe, expect, it, vi } from 'vitest';

import { useEditorStore, type AudioClip } from '../state/editorStore';
import {
  createMidiClip,
  isMidiClip,
  midiClipLengthUpdate,
  midiClipWindow,
  reviveMidiClip,
  sanitizePianoNotes,
} from './midiClip';
import {
  bouncedClipUpdate,
  bounceMidiClipToAudio,
  peaksFromSamples,
  renderMidiClip,
} from './midiClipActions';

const NOTES = [
  { id: 'a', pitch: 60, start: 0, duration: 1, velocity: 100 },
  { id: 'b', pitch: 64, start: 1, duration: 0.5, velocity: 80 },
];

afterEach(() => {
  vi.useRealTimers();
  useEditorStore.getState().loadProject({ tracks: [], clips: [] });
});

describe('createMidiClip', () => {
  it('makes a piano-roll clip sized in bars at the tempo', () => {
    const clip = createMidiClip({
      trackId: 't1',
      startSec: 3,
      bpm: 120,
      bars: 2,
    });
    expect(isMidiClip(clip)).toBe(true);
    expect(clip.durationSec).toBe(4);
    expect(clip.sourceDuration).toBe(4);
    expect(clip.sourceBpm).toBe(120);
    expect(clip.sourcePianoRoll).toEqual([]);
    expect(clip.audioBlob.size).toBe(0);
  });

  it('measures a split clip window in source beats', () => {
    const clip = {
      ...createMidiClip({ trackId: 't1', startSec: 0, bpm: 120, bars: 2 }),
      offsetIntoSource: 1,
      durationSec: 2,
    };
    expect(midiClipWindow(clip, 90)).toEqual({
      fromBeat: 2,
      toBeat: 6,
      bpm: 120,
    });
  });

  it('changes length in whole bars from the window start', () => {
    const clip = { offsetIntoSource: 1, sourceBpm: 120 };
    expect(midiClipLengthUpdate(clip, 4, 90)).toEqual({
      durationSec: 8,
      sourceDuration: 9,
    });
    expect(midiClipLengthUpdate(clip, 0, 90).durationSec).toBe(2);
  });
});

describe('MIDI clip serialization', () => {
  it('round-trips notes through the autosave JSON shape', () => {
    const clip = createMidiClip({
      trackId: 't1',
      startSec: 0,
      bpm: 100,
      notes: NOTES,
    });
    const { audioBlob: _blob, ...serializable } = clip;
    void _blob;
    const revived = reviveMidiClip(JSON.parse(JSON.stringify(serializable)));
    expect(revived.sourceKind).toBe('piano-roll');
    expect(revived.sourcePianoRoll).toEqual(NOTES);
    expect(revived.sourceBpm).toBe(100);
  });

  it('drops malformed notes and repairs ids, lengths and velocity', () => {
    const notes = sanitizePianoNotes([
      null,
      'x',
      { pitch: 'C4', start: 0, duration: 1 },
      { pitch: 128, start: 0, duration: 1 },
      { pitch: 60, start: -1, duration: 1 },
      { pitch: 60, start: 0, duration: Number.NaN },
      { pitch: 61.6, start: 2, duration: 0, velocity: 400 },
    ]);
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({
      pitch: 62,
      start: 2,
      duration: 0.125,
      velocity: 127,
    });
    expect(notes[0].id).toBeTruthy();
    expect(sanitizePianoNotes({ not: 'an array' })).toEqual([]);
  });

  it('leaves audio clips alone on revive', () => {
    const audio = {
      id: 'c',
      sourceKind: 'audio' as const,
      sourcePianoRoll: undefined,
    };
    expect(reviveMidiClip(audio)).toBe(audio);
  });
});

describe('bounce clip to audio', () => {
  it('normalises peaks from rendered samples', () => {
    const peaks = peaksFromSamples(new Float32Array([0, 0.5, -0.25, 0]), 2);
    expect(Array.from(peaks)).toEqual([1, 0.5]);
  });

  it('renders the notes through spessasynth into audible audio', async () => {
    const clip = {
      ...createMidiClip({
        trackId: 't1',
        startSec: 0,
        bpm: 120,
        bars: 1,
        notes: NOTES,
      }),
      id: 'm1',
    } as AudioClip;
    const audio = await renderMidiClip(clip, 120);
    expect(audio.left.length).toBe(Math.ceil(3 * audio.sampleRate));
    expect(
      Math.max(...audio.left.subarray(0, audio.sampleRate).map(Math.abs)),
    ).toBeGreaterThan(0.01);
    const update = bouncedClipUpdate(clip, audio);
    expect(update.sourceKind).toBe('audio');
    expect(update.mimeType).toBe('audio/wav');
    expect(update.label).toBe('MIDI clip (bounced)');
    expect(update.audioBlob?.size).toBe(44 + audio.left.length * 2 * 2);
  });

  it('replaces the MIDI clip on the timeline as one undo step', async () => {
    vi.useFakeTimers({ toFake: ['performance'] });
    const store = useEditorStore.getState();
    const trackId = store.addTrack({ name: 'Keys' });
    const id = store.addClipToTrack(
      createMidiClip({ trackId, startSec: 2, bpm: 120, bars: 1, notes: NOTES }),
    );
    const undoDepth = useEditorStore.getState()._undo.length;
    vi.advanceTimersByTime(1000);

    expect(await bounceMidiClipToAudio(id)).toBe(true);
    const bounced = useEditorStore.getState().clips.find((c) => c.id === id);
    expect(bounced).toMatchObject({
      sourceKind: 'audio',
      startSec: 2,
      durationSec: 2,
    });
    expect(bounced?.audioBlob.size).toBeGreaterThan(44);
    expect(useEditorStore.getState()._undo.length).toBe(undoDepth + 1);

    useEditorStore.getState().undo();
    expect(
      useEditorStore.getState().clips.find((c) => c.id === id)?.sourceKind,
    ).toBe('piano-roll');
    expect(await bounceMidiClipToAudio('missing')).toBe(false);
  });
});
