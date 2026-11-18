export type AudioSniff = 'audio' | 'not-audio' | 'unknown';

/** Bytes `sniffAudioBytes` needs to classify every signature it knows. */
export const AUDIO_SNIFF_BYTES = 16;

function ascii(bytes: Uint8Array, offset: number, text: string): boolean {
  if (bytes.length < offset + text.length) {
    return false;
  }
  for (let i = 0; i < text.length; i += 1) {
    if (bytes[offset + i] !== text.charCodeAt(i)) {
      return false;
    }
  }
  return true;
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return (
    bytes.length >= signature.length &&
    signature.every((byte, i) => bytes[i] === byte)
  );
}

const AUDIO_ASCII_AT_0 = [
  'ID3',
  'fLaC',
  'OggS',
  'RF64',
  'BW64',
  'caff',
  'MAC ',
  'wvpk',
  'DSD ',
  'FRM8',
  '#!AMR',
  '.snd',
];

const NOT_AUDIO_ASCII_AT_0 = [
  '%PDF',
  'GIF8',
  'PK\u0003\u0004',
  'Rar!',
  '\u007fELF',
  'MZ',
  'SQLite format 3',
  'bplist',
  '{\\rtf',
];

const NOT_AUDIO_BYTES: readonly (readonly number[])[] = [
  [0x89, 0x50, 0x4e, 0x47],
  [0xff, 0xd8, 0xff],
  [0x1f, 0x8b],
  [0x37, 0x7a, 0xbc, 0xaf],
  [0x49, 0x49, 0x2a, 0x00],
  [0x4d, 0x4d, 0x00, 0x2a],
  [0xcf, 0xfa, 0xed, 0xfe],
];

const AUDIO_BYTES: readonly (readonly number[])[] = [
  [0x1a, 0x45, 0xdf, 0xa3],
  [0x30, 0x26, 0xb2, 0x75],
];

function isMarkup(bytes: Uint8Array): boolean {
  let i = 0;
  if (startsWith(bytes, [0xef, 0xbb, 0xbf])) {
    i = 3;
  }
  while (i < bytes.length && /\s/.test(String.fromCharCode(bytes[i]!))) {
    i += 1;
  }
  return bytes[i] === 0x3c;
}

/**
 * Classifies a file from its first bytes. `unknown` means "let the API
 * decide": MP3 files can carry junk before the first frame, so only files
 * that are recognisably something else are refused here.
 */
export function sniffAudioBytes(bytes: Uint8Array): AudioSniff {
  if (bytes.length === 0) {
    return 'not-audio';
  }
  if (AUDIO_ASCII_AT_0.some((sig) => ascii(bytes, 0, sig))) {
    return 'audio';
  }
  if (AUDIO_BYTES.some((sig) => startsWith(bytes, sig))) {
    return 'audio';
  }
  if (ascii(bytes, 0, 'RIFF') && bytes.length >= 12) {
    return ascii(bytes, 8, 'WAVE') ? 'audio' : 'not-audio';
  }
  if (ascii(bytes, 0, 'FORM') && bytes.length >= 12) {
    return ascii(bytes, 8, 'AIFF') || ascii(bytes, 8, 'AIFC')
      ? 'audio'
      : 'not-audio';
  }
  if (ascii(bytes, 4, 'ftyp')) {
    return 'audio';
  }
  if (bytes[0] === 0xff && ((bytes[1] ?? 0) & 0xe0) === 0xe0) {
    return 'audio';
  }
  if (NOT_AUDIO_ASCII_AT_0.some((sig) => ascii(bytes, 0, sig))) {
    return 'not-audio';
  }
  if (NOT_AUDIO_BYTES.some((sig) => startsWith(bytes, sig))) {
    return 'not-audio';
  }
  if (isMarkup(bytes)) {
    return 'not-audio';
  }
  return 'unknown';
}

export async function sniffAudioFile(file: Blob): Promise<AudioSniff> {
  const head = file.slice(0, AUDIO_SNIFF_BYTES);
  const buffer =
    typeof head.arrayBuffer === 'function'
      ? await head.arrayBuffer()
      : await readWithFileReader(head);
  return sniffAudioBytes(new Uint8Array(buffer));
}

function readWithFileReader(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}
