import { encodeWav } from '../lib/wavEncode';
import type { NoteEvent } from './noteEditing';

export const RENDER_SAMPLE_RATE = 44_100;
/** Release tail after the last note-off so the synth's envelope rings out. */
export const RENDER_TAIL_SEC = 1;
/** spessasynth applies queued events between process() calls, so this is the
 *  timing resolution of a render (about 2.9 ms at 44.1 kHz). */
const BLOCK = 128;

type SpessaModule = typeof import('spessasynth_core');

let spessaPromise: Promise<SpessaModule> | null = null;
let customBank: { name: string; bytes: ArrayBuffer } | null = null;

/** spessasynth is ~600 KB of JS, so it loads only when a MIDI clip is first
 *  previewed or bounced, never with the editor itself. */
function loadSpessa(): Promise<SpessaModule> {
  if (!spessaPromise) {
    spessaPromise = import('spessasynth_core').catch((e: unknown) => {
      spessaPromise = null;
      throw e;
    });
  }
  return spessaPromise;
}

/** Use a SoundFont the artist picked (SF2/SF3/DLS) for this session instead of
 *  the built-in saw bank. It is not persisted: the bounce keeps the sound. */
export function setMidiSoundBank(
  bank: { name: string; bytes: ArrayBuffer } | null,
): void {
  customBank = bank;
}

export const midiSoundBankName = (): string | null => customBank?.name ?? null;

export interface RenderedAudio {
  left: Float32Array<ArrayBuffer>;
  right: Float32Array<ArrayBuffer>;
  sampleRate: number;
}

export async function renderNoteEvents(
  events: readonly NoteEvent[],
  opts: { lengthSec: number; program?: number; tailSec?: number },
): Promise<RenderedAudio> {
  const spessa = await loadSpessa();
  const sampleRate = RENDER_SAMPLE_RATE;
  const synth = new spessa.SpessaSynthProcessor(sampleRate, {
    eventsEnabled: false,
    maxBufferSize: BLOCK,
  });
  const bankBytes =
    customBank?.bytes ?? spessa.BasicSoundBank.getSampleSoundBankFile();
  synth.soundBankManager.addSoundBank(
    spessa.SoundBankLoader.fromArrayBuffer(bankBytes.slice(0)),
    'main',
  );
  await synth.processorInitialized;
  if (opts.program !== undefined) {
    synth.programChange(0, opts.program);
  }

  const tail = opts.tailSec ?? RENDER_TAIL_SEC;
  const total = Math.max(
    BLOCK,
    Math.ceil((opts.lengthSec + tail) * sampleRate),
  );
  const left = new Float32Array(total);
  const right = new Float32Array(total);
  let next = 0;
  for (let filled = 0; filled < total; filled += BLOCK) {
    while (
      next < events.length &&
      Math.round(events[next].timeSec * sampleRate) <= filled
    ) {
      const ev = events[next++];
      if (ev.type === 'on') {
        synth.noteOn(0, ev.pitch, ev.velocity);
      } else {
        synth.noteOff(0, ev.pitch);
      }
    }
    synth.process(left, right, filled, Math.min(BLOCK, total - filled));
  }
  return { left, right, sampleRate };
}

export function renderedToWav(audio: RenderedAudio): Blob {
  const channels = [audio.left, audio.right];
  return encodeWav({
    numberOfChannels: 2,
    sampleRate: audio.sampleRate,
    length: audio.left.length,
    getChannelData: (c: number) => channels[c],
  } as unknown as AudioBuffer);
}
