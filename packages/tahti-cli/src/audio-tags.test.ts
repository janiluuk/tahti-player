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

function vorbisComments(comments: string[]) {
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
  return Buffer.concat(parts);
}

function flacFile(comments: string[]) {
  const vorbis = vorbisComments(comments);
  const streamInfo = Buffer.concat([
    Buffer.from([0, 0, 0, 34]),
    Buffer.alloc(34),
  ]);
  const header = Buffer.from([0x84, 0, 0, 0]);
  header.writeUIntBE(vorbis.length, 1, 3);
  return Buffer.concat([Buffer.from('fLaC'), streamInfo, header, vorbis]);
}

function oggPage(
  serial: number,
  sequence: number,
  lacing: number[],
  body: Buffer,
) {
  const header = Buffer.alloc(27);
  header.write('OggS', 0, 'latin1');
  header.writeUInt32LE(serial, 14);
  header.writeUInt32LE(sequence, 18);
  header[26] = lacing.length;
  return Buffer.concat([header, Buffer.from(lacing), body]);
}

function oggFile(packets: Buffer[], segmentsPerPage: number) {
  const lacing: number[] = [];
  for (const packet of packets) {
    for (let left = packet.length; ; left -= 255) {
      lacing.push(Math.min(left, 255));
      if (left < 255) {
        break;
      }
    }
  }
  const data = Buffer.concat(packets);
  const pages: Buffer[] = [];
  let offset = 0;
  for (let start = 0; start < lacing.length; start += segmentsPerPage) {
    const pageLacing = lacing.slice(start, start + segmentsPerPage);
    const length = pageLacing.reduce((sum, size) => sum + size, 0);
    pages.push(
      oggPage(
        7,
        pages.length,
        pageLacing,
        data.subarray(offset, offset + length),
      ),
    );
    offset += length;
    if (pages.length === 1) {
      pages.push(oggPage(9, 0, [4], Buffer.from('skip')));
    }
  }
  return Buffer.concat(pages);
}

function mp4Box(type: string, ...children: Buffer[]) {
  const body = Buffer.concat(children);
  const header = Buffer.alloc(8);
  header.writeUInt32BE(body.length + 8);
  header.write(type, 4, 'latin1');
  return Buffer.concat([header, body]);
}

function mp4Data(kind: number, payload: Buffer) {
  const flags = Buffer.alloc(8);
  flags.writeUInt32BE(kind);
  return mp4Box('data', flags, payload);
}

function m4aFile(items: Buffer[], { versionedMeta = true } = {}) {
  return Buffer.concat([
    mp4Box('ftyp', Buffer.from('M4A \u0000\u0000\u0000\u0000', 'latin1')),
    mp4Box('mdat', Buffer.alloc(64)),
    mp4Box(
      'moov',
      mp4Box('mvhd', Buffer.alloc(100)),
      mp4Box('trak', Buffer.alloc(40)),
      mp4Box(
        'udta',
        mp4Box(
          'meta',
          ...(versionedMeta ? [Buffer.alloc(4)] : []),
          mp4Box('hdlr', Buffer.alloc(25)),
          mp4Box('ilst', ...items),
        ),
      ),
    ),
  ]);
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

  it('reads Ogg Vorbis comments that span pages, skipping other streams', async () => {
    const path = join(folder, 'f.ogg');
    const identification = Buffer.concat([
      Buffer.from('\u0001vorbis', 'latin1'),
      Buffer.alloc(23),
    ]);
    const comments = Buffer.concat([
      Buffer.from('\u0003vorbis', 'latin1'),
      vorbisComments([
        `DESCRIPTION=${'x'.repeat(600)}`,
        'TITLE=Revontulet',
        'Artist=Aurora',
        'genre=Ambient',
        'bpm=88',
      ]),
      Buffer.from([1]),
    ]);
    await writeFile(
      path,
      oggFile([identification, comments, Buffer.alloc(300)], 2),
    );
    expect(await readAudioTags(path)).toEqual({
      title: 'Revontulet',
      artist: 'Aurora',
      genre: 'Ambient',
      bpm: 88,
    });
  });

  it('reads Opus tags', async () => {
    const path = join(folder, 'g.opus');
    await writeFile(
      path,
      oggFile(
        [
          Buffer.concat([Buffer.from('OpusHead'), Buffer.alloc(11)]),
          Buffer.concat([
            Buffer.from('OpusTags'),
            vorbisComments(['title=Kaamos', 'ARTIST=Kari']),
          ]),
        ],
        255,
      ),
    );
    expect(await readAudioTags(path)).toEqual({
      title: 'Kaamos',
      artist: 'Kari',
    });
  });

  it('reads M4A items after the media data', async () => {
    const path = join(folder, 'h.m4a');
    const tempo = Buffer.alloc(2);
    tempo.writeUInt16BE(124);
    await writeFile(
      path,
      m4aFile([
        mp4Box('\u00a9nam', mp4Data(1, Buffer.from('Yötön yö'))),
        mp4Box('\u00a9ART', mp4Data(1, Buffer.from('Aurora'))),
        mp4Box('covr', mp4Data(13, Buffer.alloc(32))),
        mp4Box('\u00a9gen', mp4Data(1, Buffer.from('Deep House'))),
        mp4Box('tmpo', mp4Data(21, tempo)),
      ]),
    );
    expect(await readAudioTags(path)).toEqual({
      title: 'Yötön yö',
      artist: 'Aurora',
      genre: 'Deep House',
      bpm: 124,
    });
  });

  it('reads a QuickTime-style meta box without version bytes', async () => {
    const path = join(folder, 'i.m4a');
    await writeFile(
      path,
      m4aFile([mp4Box('\u00a9nam', mp4Data(1, Buffer.from('Dawn')))], {
        versionedMeta: false,
      }),
    );
    expect(await readAudioTags(path)).toEqual({ title: 'Dawn' });
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
    const bareM4a = join(folder, 'j.m4a');
    await writeFile(
      bareM4a,
      Buffer.concat([mp4Box('ftyp', Buffer.from('M4A ')), mp4Box('mdat')]),
    );
    expect(await readAudioTags(bareM4a)).toEqual({});
    const brokenOgg = join(folder, 'k.ogg');
    await writeFile(brokenOgg, oggPage(7, 0, [30], Buffer.from('OpusHead')));
    expect(await readAudioTags(brokenOgg)).toEqual({});
  });
});
