import { open } from 'node:fs/promises';

const MAX_TAG_BYTES = 4 * 1024 * 1024;

const ID3_FRAMES = {
  TIT2: 'title',
  TT2: 'title',
  TPE1: 'artist',
  TP1: 'artist',
  TCON: 'genre',
  TCO: 'genre',
  TBPM: 'bpm',
  TBP: 'bpm',
};

const VORBIS_FIELDS = {
  TITLE: 'title',
  ARTIST: 'artist',
  GENRE: 'genre',
  BPM: 'bpm',
};

async function readBytes(handle, position, length) {
  const buffer = Buffer.alloc(length);
  const { bytesRead } = await handle.read(buffer, 0, length, position);
  return buffer.subarray(0, bytesRead);
}

function syncsafe(bytes, offset) {
  return (
    ((bytes[offset] & 0x7f) << 21) |
    ((bytes[offset + 1] & 0x7f) << 14) |
    ((bytes[offset + 2] & 0x7f) << 7) |
    (bytes[offset + 3] & 0x7f)
  );
}

function decodeUtf16(bytes) {
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    const swapped = Buffer.from(bytes.subarray(2));
    swapped.swap16();
    return swapped.toString('utf16le');
  }
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return bytes.subarray(2).toString('utf16le');
  }
  return bytes.toString('utf16le');
}

export function decodeId3Text(bytes) {
  const encoding = bytes[0];
  const body = bytes.subarray(1);
  let text;
  if (encoding === 1) {
    text = decodeUtf16(body.subarray(0, body.length - (body.length % 2)));
  } else if (encoding === 2) {
    const swapped = Buffer.from(
      body.subarray(0, body.length - (body.length % 2)),
    );
    swapped.swap16();
    text = swapped.toString('utf16le');
  } else if (encoding === 3) {
    text = body.toString('utf8');
  } else {
    text = body.toString('latin1');
  }
  return text.split('\u0000')[0].trim();
}

export function parseId3(tag) {
  const major = tag[3];
  const flags = tag[5];
  if (major < 2 || major > 4 || flags & 0x80) {
    return {};
  }
  const short = major === 2;
  const headerSize = short ? 6 : 10;
  const idLength = short ? 3 : 4;
  let offset = 10;
  if (!short && flags & 0x40) {
    offset += major === 4 ? syncsafe(tag, 10) : tag.readUInt32BE(10) + 4;
  }
  const tags = {};
  while (offset + headerSize <= tag.length) {
    const id = tag.toString('latin1', offset, offset + idLength);
    if (!/^[A-Z0-9]+$/.test(id)) {
      break;
    }
    let size;
    if (short) {
      size = tag.readUIntBE(offset + 3, 3);
    } else if (major === 4) {
      size = syncsafe(tag, offset + 4);
    } else {
      size = tag.readUInt32BE(offset + 4);
    }
    const start = offset + headerSize;
    const field = ID3_FRAMES[id];
    if (field && size > 1 && !tags[field]) {
      const text = decodeId3Text(tag.subarray(start, start + size));
      if (text) {
        tags[field] = text;
      }
    }
    offset = start + size;
  }
  return tags;
}

export function parseVorbisComments(block) {
  const tags = {};
  let offset = 0;
  const vendorLength = block.readUInt32LE(offset);
  offset += 4 + vendorLength;
  const count = block.readUInt32LE(offset);
  offset += 4;
  for (let index = 0; index < count && offset + 4 <= block.length; index += 1) {
    const length = block.readUInt32LE(offset);
    offset += 4;
    const comment = block.toString('utf8', offset, offset + length);
    offset += length;
    const separator = comment.indexOf('=');
    const field = VORBIS_FIELDS[comment.slice(0, separator).toUpperCase()];
    const value = comment.slice(separator + 1).trim();
    if (separator > 0 && field && value && !tags[field]) {
      tags[field] = value;
    }
  }
  return tags;
}

async function readFlacTags(handle) {
  let position = 4;
  for (let blocks = 0; blocks < 128; blocks += 1) {
    const header = await readBytes(handle, position, 4);
    if (header.length < 4) {
      return {};
    }
    const last = header[0] & 0x80;
    const type = header[0] & 0x7f;
    const length = header.readUIntBE(1, 3);
    if (type === 4) {
      return parseVorbisComments(
        await readBytes(handle, position + 4, Math.min(length, MAX_TAG_BYTES)),
      );
    }
    if (last) {
      return {};
    }
    position += 4 + length;
  }
  return {};
}

function cleanTags(tags) {
  const clean = {};
  if (tags.title) {
    clean.title = tags.title.slice(0, 200);
  }
  if (tags.artist) {
    clean.artist = tags.artist.slice(0, 120);
  }
  if (tags.genre && !/^\(\d+\)$/.test(tags.genre)) {
    clean.genre = tags.genre.replace(/^\(\d+\)/, '').slice(0, 80);
  }
  const bpm = Math.round(Number.parseFloat(tags.bpm));
  if (bpm >= 40 && bpm <= 300) {
    clean.bpm = bpm;
  }
  return clean;
}

/** Title, artist, genre and BPM from an MP3's ID3v2 tag or a FLAC file's
 * Vorbis comments. Other formats, and unreadable tags, give `{}`. */
export async function readAudioTags(path) {
  let handle;
  try {
    handle = await open(path, 'r');
    const head = await readBytes(handle, 0, 10);
    if (head.toString('latin1', 0, 3) === 'ID3' && head.length === 10) {
      const size = Math.min(syncsafe(head, 6), MAX_TAG_BYTES);
      return cleanTags(parseId3(await readBytes(handle, 0, size + 10)));
    }
    if (head.toString('latin1', 0, 4) === 'fLaC') {
      return cleanTags(await readFlacTags(handle));
    }
    return {};
  } catch {
    return {};
  } finally {
    await handle?.close();
  }
}
