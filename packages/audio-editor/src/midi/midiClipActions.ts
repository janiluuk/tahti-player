import {
  getEngineCtx,
  getMasterGain,
  resumeEngine,
} from '@tahti-player/audio-core';

import { useEditorStore, type AudioClip } from '../state/editorStore';
import { isMidiClip, midiClipWindow } from './midiClip';
import {
  renderedToWav,
  renderNoteEvents,
  type RenderedAudio,
} from './midiRender';
import { noteEvents } from './noteEditing';

const PEAK_BINS = 240;

export function renderMidiClip(
  clip: AudioClip,
  projectBpm: number,
): Promise<RenderedAudio> {
  const { fromBeat, toBeat, bpm } = midiClipWindow(clip, projectBpm);
  return renderNoteEvents(
    noteEvents(clip.sourcePianoRoll ?? [], bpm, fromBeat, toBeat),
    { lengthSec: clip.durationSec, program: clip.instrumentProgram },
  );
}

/** Normalised waveform peaks straight from the rendered samples, so a bounce
 *  needs no decode round trip through an AudioContext. */
export function peaksFromSamples(
  samples: Float32Array,
  bins = PEAK_BINS,
): Float32Array {
  const out = new Float32Array(bins);
  const per = Math.max(1, Math.floor(samples.length / bins));
  let max = 0;
  for (let i = 0; i < bins; i += 1) {
    let peak = 0;
    const end = Math.min((i + 1) * per, samples.length);
    for (let j = i * per; j < end; j += 1) {
      const v = Math.abs(samples[j]);
      if (v > peak) {
        peak = v;
      }
    }
    out[i] = peak;
    max = Math.max(max, peak);
  }
  if (max > 0) {
    for (let i = 0; i < bins; i += 1) {
      out[i] /= max;
    }
  }
  return out;
}

/** The clip fields that turn a MIDI clip into the audio clip it renders to.
 *  The notes stay on the clip so the bounce can be traced back to them, but
 *  `sourceKind: 'audio'` is what makes playback and the mixdown include it. */
export function bouncedClipUpdate(
  clip: AudioClip,
  audio: RenderedAudio,
): Partial<AudioClip> {
  return {
    audioBlob: renderedToWav(audio),
    mimeType: 'audio/wav',
    sourceKind: 'audio',
    sourceDuration: audio.left.length / audio.sampleRate,
    offsetIntoSource: 0,
    peaks: peaksFromSamples(audio.left),
    label: `${clip.label} (bounced)`,
    renderedProgram: clip.instrumentProgram,
  };
}

/** Render a MIDI clip offline and replace it on the timeline with the audio,
 *  as one undoable step. Returns false when the clip is gone or not MIDI. */
export async function bounceMidiClipToAudio(clipId: string): Promise<boolean> {
  const st = useEditorStore.getState();
  const clip = st.clips.find((c) => c.id === clipId);
  if (!clip || !isMidiClip(clip)) {
    return false;
  }
  const audio = await renderMidiClip(clip, st.bpm);
  const current = useEditorStore.getState().clips.find((c) => c.id === clipId);
  if (!current || !isMidiClip(current)) {
    return false;
  }
  useEditorStore
    .getState()
    .updateClip(clipId, bouncedClipUpdate(current, audio));
  return true;
}

/** Play a MIDI clip on its own through the engine master. Resolves to a stop
 *  function once the render is ready. */
export async function previewMidiClip(
  clip: AudioClip,
  projectBpm: number,
  onEnded?: () => void,
): Promise<() => void> {
  const audio = await renderMidiClip(clip, projectBpm);
  await resumeEngine();
  const ctx = getEngineCtx();
  const buf = ctx.createBuffer(2, audio.left.length, audio.sampleRate);
  buf.copyToChannel(audio.left, 0);
  buf.copyToChannel(audio.right, 1);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(getMasterGain());
  src.onended = () => onEnded?.();
  src.start();
  return () => {
    try {
      src.stop();
    } catch {
      /* already ended */
    }
  };
}
