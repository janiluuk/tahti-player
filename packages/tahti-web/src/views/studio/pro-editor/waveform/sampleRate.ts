const MP3_RATES: Record<number, readonly number[]> = {
  3: [44100, 48000, 32000],
  2: [22050, 24000, 16000],
  0: [11025, 12000, 8000],
};

const ascii = (bytes: Uint8Array, at: number, length: number) =>
  String.fromCharCode(...bytes.subarray(at, at + length));

function wavRate(bytes: Uint8Array, view: DataView): number | null {
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const id = ascii(bytes, offset, 4);
    const size = view.getUint32(offset + 4, true);
    if (id === 'fmt ' && offset + 16 <= bytes.length) {
      return view.getUint32(offset + 12, true);
    }
    offset += 8 + size + (size % 2);
  }
  return null;
}

function flacRate(bytes: Uint8Array): number | null {
  if (bytes.length < 21) {
    return null;
  }
  return (bytes[18]! << 12) | (bytes[19]! << 4) | (bytes[20]! >> 4);
}

function mp3Rate(bytes: Uint8Array): number | null {
  let offset = 0;
  if (ascii(bytes, 0, 3) === 'ID3' && bytes.length > 10) {
    const size =
      ((bytes[6]! & 0x7f) << 21) |
      ((bytes[7]! & 0x7f) << 14) |
      ((bytes[8]! & 0x7f) << 7) |
      (bytes[9]! & 0x7f);
    offset = 10 + size;
  }
  const limit = Math.min(bytes.length - 3, offset + 64 * 1024);
  for (let i = offset; i < limit; i++) {
    if (bytes[i] !== 0xff || (bytes[i + 1]! & 0xe0) !== 0xe0) {
      continue;
    }
    const version = (bytes[i + 1]! >> 3) & 0x03;
    const layer = (bytes[i + 1]! >> 1) & 0x03;
    const rateIndex = (bytes[i + 2]! >> 2) & 0x03;
    const rate = MP3_RATES[version]?.[rateIndex];
    if (layer !== 0 && rate) {
      return rate;
    }
  }
  return null;
}

/** The file's own sample rate from its header (WAV, FLAC, MP3, Ogg Opus/Vorbis),
 * so it can be decoded without resampling. `null` when unknown (e.g. AAC),
 * in which case the caller decodes at a default rate. */
export function sniffSampleRate(buffer: ArrayBuffer): number | null {
  const bytes = new Uint8Array(
    buffer,
    0,
    Math.min(buffer.byteLength, 128 * 1024),
  );
  if (bytes.length < 12) {
    return null;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const magic = ascii(bytes, 0, 4);
  let rate: number | null = null;
  if (magic === 'RIFF' && ascii(bytes, 8, 4) === 'WAVE') {
    rate = wavRate(bytes, view);
  } else if (magic === 'fLaC') {
    rate = flacRate(bytes);
  } else if (magic === 'OggS') {
    if (ascii(bytes, 28, 8) === 'OpusHead') {
      rate = 48000;
    } else if (ascii(bytes, 29, 6) === 'vorbis' && bytes.length >= 44) {
      rate = view.getUint32(40, true);
    }
  } else {
    rate = mp3Rate(bytes);
  }
  return rate && rate >= 8000 && rate <= 384000 ? rate : null;
}
