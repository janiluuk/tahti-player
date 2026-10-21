import { open } from 'node:fs/promises';

const MAX_TAG_BYTES = 4 * 1024 * 1024;
const OGG_PAGE_HEADER_BYTES = 27;
const MP4_BOX_HEADER_BYTES = 8;
const MP4_LARGE_BOX_HEADER_BYTES = 16;
const MP4_UTF8_DATA = 1;

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

const MP4_ITEMS = {
  '\u00a9nam': 'title',
  '\u00a9ART': 'artist',
  '\u00a9gen': 'genre',
  tmpo: 'bpm',
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

/** The second packet of the first logical stream: the comment header in Ogg
 * Vorbis and Ogg Opus. A packet can span pages, so pages are joined until it
 * ends; one cut short by the size limit is returned as far as it was read. */
async function readOggCommentPacket(handle) {
  const packets = [];
  let pending = [];
  let pendingBytes = 0;
  let serial = null;
  let position = 0;
  while (packets.length < 2 && pendingBytes < MAX_TAG_BYTES) {
    const header = await readBytes(handle, position, OGG_PAGE_HEADER_BYTES);
    if (
      header.length < OGG_PAGE_HEADER_BYTES ||
      header.toString('latin1', 0, 4) !== 'OggS'
    ) {
      break;
    }
    const lacing = await readBytes(
      handle,
      position + OGG_PAGE_HEADER_BYTES,
      header[26],
    );
    const bodyStart = position + OGG_PAGE_HEADER_BYTES + lacing.length;
    const bodyLength = lacing.reduce((sum, size) => sum + size, 0);
    position = bodyStart + bodyLength;
    const pageSerial = header.readUInt32LE(14);
    serial ??= pageSerial;
    if (pageSerial !== serial) {
      continue;
    }
    const body = await readBytes(handle, bodyStart, bodyLength);
    let offset = 0;
    for (const size of lacing) {
      pending.push(body.subarray(offset, offset + size));
      pendingBytes += size;
      offset += size;
      if (size < 255) {
        packets.push(Buffer.concat(pending));
        pending = [];
        pendingBytes = 0;
      }
    }
  }
  if (packets.length > 1) {
    return packets[1];
  }
  return packets.length === 1 && pending.length > 0
    ? Buffer.concat(pending)
    : null;
}

async function readOggTags(handle) {
  const packet = await readOggCommentPacket(handle);
  if (packet?.toString('latin1', 0, 7) === '\u0003vorbis') {
    return parseVorbisComments(packet.subarray(7));
  }
  if (packet?.toString('latin1', 0, 8) === 'OpusTags') {
    return parseVorbisComments(packet.subarray(8));
  }
  return {};
}

async function findMp4Box(handle, start, end, type) {
  let position = start;
  while (position + MP4_BOX_HEADER_BYTES <= end) {
    const header = await readBytes(
      handle,
      position,
      MP4_LARGE_BOX_HEADER_BYTES,
    );
    if (header.length < MP4_BOX_HEADER_BYTES) {
      return null;
    }
    let size = header.readUInt32BE(0);
    let headerSize = MP4_BOX_HEADER_BYTES;
    if (size === 1 && header.length === MP4_LARGE_BOX_HEADER_BYTES) {
      size = Number(header.readBigUInt64BE(8));
      headerSize = MP4_LARGE_BOX_HEADER_BYTES;
    } else if (size === 0) {
      size = end - position;
    }
    if (size < headerSize) {
      return null;
    }
    if (header.toString('latin1', 4, 8) === type) {
      return {
        bodyStart: position + headerSize,
        end: Math.min(position + size, end),
      };
    }
    position += size;
  }
  return null;
}

function mp4Children(buffer, start, end) {
  const children = [];
  let position = start;
  while (position + MP4_BOX_HEADER_BYTES <= end) {
    const size = buffer.readUInt32BE(position);
    if (size < MP4_BOX_HEADER_BYTES) {
      break;
    }
    children.push({
      type: buffer.toString('latin1', position + 4, position + 8),
      bodyStart: position + MP4_BOX_HEADER_BYTES,
      end: Math.min(position + size, end),
    });
    position += size;
  }
  return children;
}

/** iTunes-style items (moov/udta/meta/ilst) from the body of an MP4 `udta`
 * box. */
function parseMp4Udta(udta) {
  const meta = mp4Children(udta, 0, udta.length).find(
    (box) => box.type === 'meta',
  );
  if (!meta) {
    return {};
  }
  // MP4's meta box starts with 4 bytes of version and flags; QuickTime's
  // has none and goes straight to its first child box.
  const metaChildren =
    udta.readUInt32BE(meta.bodyStart) === 0
      ? meta.bodyStart + 4
      : meta.bodyStart;
  const ilst = mp4Children(udta, metaChildren, meta.end).find(
    (box) => box.type === 'ilst',
  );
  if (!ilst) {
    return {};
  }
  const tags = {};
  for (const item of mp4Children(udta, ilst.bodyStart, ilst.end)) {
    const field = MP4_ITEMS[item.type];
    const data =
      field &&
      !tags[field] &&
      mp4Children(udta, item.bodyStart, item.end).find(
        (box) => box.type === 'data',
      );
    if (!data || data.end - data.bodyStart <= 8) {
      continue;
    }
    const payload = udta.subarray(data.bodyStart + 8, data.end);
    let value = '';
    if (field === 'bpm') {
      value =
        payload.length <= 4
          ? String(payload.readUIntBE(0, payload.length))
          : '';
    } else if (
      (udta.readUInt32BE(data.bodyStart) & 0xffffff) ===
      MP4_UTF8_DATA
    ) {
      value = payload.toString('utf8').trim();
    }
    if (value) {
      tags[field] = value;
    }
  }
  return tags;
}

async function readMp4Tags(handle) {
  const { size } = await handle.stat();
  const moov = await findMp4Box(handle, 0, size, 'moov');
  const udta =
    moov && (await findMp4Box(handle, moov.bodyStart, moov.end, 'udta'));
  if (!udta) {
    return {};
  }
  return parseMp4Udta(
    await readBytes(
      handle,
      udta.bodyStart,
      Math.min(udta.end - udta.bodyStart, MAX_TAG_BYTES),
    ),
  );
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

/** Title, artist, genre and BPM from an MP3's ID3v2 tag, the Vorbis comments
 * of a FLAC, Ogg Vorbis or Opus file, or an M4A file's iTunes items. Other
 * formats, and unreadable tags, give `{}`. */
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
    if (head.toString('latin1', 0, 4) === 'OggS') {
      return cleanTags(await readOggTags(handle));
    }
    if (head.toString('latin1', 4, 8) === 'ftyp') {
      return cleanTags(await readMp4Tags(handle));
    }
    return {};
  } catch {
    return {};
  } finally {
    await handle?.close();
  }
}
