import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { readAudioTags } from './audio-tags.mjs';

function syncsafe(size: number) {
  return Buffer.from([
    (size >> 21) & 0x7f,
    (size >> 14) & 0x7f,
    (size >> 7) & 0x7f,
    size & 0x7f,
  ]);
}

function id3Frame(id: string, text: Buffer, version: 3 | 4) {
  const size = Buffer.alloc(4);
  if (version === 4) {
    syncsafe(text.length).copy(size);
  } else {
    size.writeUInt32BE(text.length);
  }
  return Buffer.concat([
    Buffer.from(id, 'latin1'),
    size,
    Buffer.alloc(2),
    text,
  ]);
}

function id3Tag(version: 3 | 4, frames: Buffer[]) {
  const body = Buffer.concat([...frames, Buffer.alloc(16)]);
  return Buffer.concat([
    Buffer.from([0x49, 0x44, 0x33, version, 0, 0]),
    syncsafe(body.length),
    body,
    Buffer.from('audio-frames'),
  ]);
}

function utf16(text: string) {
  return Buffer.concat([
    Buffer.from([1, 0xff, 0xfe]),
    Buffer.from(text, 'utf16le'),
    Buffer.alloc(2),
  ]);
}

function flacFile(comments: string[]) {
  const vendor = Buffer.from('test');
  const parts = [Buffer.alloc(4), vendor, Buffer.alloc(4)];
  parts[0].writeUInt32LE(vendor.length);
  parts[2].writeUInt32LE(comments.length);
  for (const comment of comments) {
    const bytes = Buffer.from(comment, 'utf8');
    const length = Buffer.alloc(4);
    length.writeUInt32LE(bytes.length);
    parts.push(length, bytes);
  }
  const vorbis = Buffer.concat(parts);
  const streamInfo = Buffer.concat([
    Buffer.from([0, 0, 0, 34]),
    Buffer.alloc(34),
  ]);
  const header = Buffer.from([0x84, 0, 0, 0]);
  header.writeUIntBE(vorbis.length, 1, 3);
  return Buffer.concat([Buffer.from('fLaC'), streamInfo, header, vorbis]);
}

describe('readAudioTags', () => {
  let folder: string;

  beforeEach(async () => {
    folder = await mkdtemp(join(tmpdir(), 'tahti-tags-'));
  });

  afterEach(async () => {
    await rm(folder, { recursive: true, force: true });
  });

  it('reads ID3v2.4 UTF-8 frames', async () => {
    const path = join(folder, 'a.mp3');
    await writeFile(
      path,
      id3Tag(4, [
        id3Frame('TIT2', Buffer.from('\u0003Yötön yö\u0000'), 4),
        id3Frame('TPE1', Buffer.from('\u0003Aurora'), 4),
        id3Frame('TCON', Buffer.from('\u0003Techno'), 4),
        id3Frame('TBPM', Buffer.from('\u0003127.6'), 4),
      ]),
    );
    expect(await readAudioTags(path)).toEqual({
      title: 'Yötön yö',
      artist: 'Aurora',
      genre: 'Techno',
      bpm: 128,
    });
  });

  it('reads ID3v2.3 UTF-16 and Latin-1 frames and drops numeric genres', async () => {
    const path = join(folder, 'b.mp3');
    await writeFile(
      path,
      id3Tag(3, [
        id3Frame('TIT2', utf16('Night Drive'), 3),
        id3Frame('TPE1', Buffer.from('\u0000Kari'), 3),
        id3Frame('TCON', Buffer.from('\u0000(18)'), 3),
        id3Frame('TBPM', Buffer.from('\u00009'), 3),
      ]),
    );
    expect(await readAudioTags(path)).toEqual({
      title: 'Night Drive',
      artist: 'Kari',
    });
  });

  it('reads FLAC Vorbis comments in any case', async () => {
    const path = join(folder, 'c.flac');
    await writeFile(
      path,
      flacFile(['title=Blue Hour', 'ARTIST=Aurora', 'Genre=Ambient', 'BPM=90']),
    );
    expect(await readAudioTags(path)).toEqual({
      title: 'Blue Hour',
      artist: 'Aurora',
      genre: 'Ambient',
      bpm: 90,
    });
  });

  it('gives nothing for untagged, other or missing files', async () => {
    const plain = join(folder, 'd.mp3');
    await writeFile(plain, 'mp3-bytes');
    expect(await readAudioTags(plain)).toEqual({});
    const truncated = join(folder, 'e.mp3');
    await writeFile(
      truncated,
      Buffer.from([0x49, 0x44, 0x33, 4, 0, 0, 0, 0, 1]),
    );
    expect(await readAudioTags(truncated)).toEqual({});
    expect(await readAudioTags(join(folder, 'nope.flac'))).toEqual({});
  });
});
