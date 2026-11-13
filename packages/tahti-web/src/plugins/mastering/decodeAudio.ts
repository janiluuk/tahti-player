import { i18n } from '@tahti-player/i18n';

export type DecodedTrack = {
  left: Float32Array;
  right: Float32Array;
  sampleRate: number;
  durationSec: number;
};

/** Decodes an `AudioBuffer` into a plain stereo `DecodedTrack`, upmixing
 * mono to stereo (matchering's own `mono_to_stereo`) — mirrors
 * `StudioProEditorView.tsx`'s existing `fetch → arrayBuffer →
 * decodeAudioData` pattern for loading a track's real audio client-side. */
function fromAudioBuffer(buffer: AudioBuffer): DecodedTrack {
  const left = buffer.getChannelData(0).slice();
  const right =
    buffer.numberOfChannels > 1
      ? buffer.getChannelData(1).slice()
      : left.slice();
  return {
    left,
    right,
    sampleRate: buffer.sampleRate,
    durationSec: buffer.duration,
  };
}

/** Decodes both the source URL and the reference file through the *same*
 * `AudioContext`, which is what guarantees they land at the same sample
 * rate (the Web Audio spec resamples `decodeAudioData`'s output to the
 * context's own rate) — `matchTracks` requires that and throws a clear
 * error otherwise. */
export async function decodeSourceAndReference(
  sourceUrl: string,
  referenceFile: File,
): Promise<{ source: DecodedTrack; reference: DecodedTrack }> {
  const context = new AudioContext();
  try {
    const [sourceBuffer, referenceBuffer] = await Promise.all([
      fetch(sourceUrl)
        .then((res) => {
          if (!res.ok) {
            throw new Error(i18n.t('web:batch57.couldNotLoadTrackAudio'));
          }
          return res.arrayBuffer();
        })
        .then((buf) => context.decodeAudioData(buf)),
      referenceFile
        .arrayBuffer()
        .then((buf) => context.decodeAudioData(buf))
        .catch(() => {
          throw new Error(i18n.t('web:batch57.couldNotDecodeReference'));
        }),
    ]);
    return {
      source: fromAudioBuffer(sourceBuffer),
      reference: fromAudioBuffer(referenceBuffer),
    };
  } finally {
    void context.close();
  }
}
