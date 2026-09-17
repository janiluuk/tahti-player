import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { parseTracklist, readTracklistFile } from './tracklistImport';

const FIXTURES_DIR = join(__dirname, '__fixtures__', 'tracklist');

function readFixture(name: string): Buffer {
  return readFileSync(join(FIXTURES_DIR, name));
}

async function importFixture(
  name: string,
): Promise<ReturnType<typeof parseTracklist>> {
  const buffer = readFixture(name);
  const file = new File([buffer], name);
  return parseTracklist(await readTracklistFile(file), name);
}

const TRAKTOR_PLAYLIST_NML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<NML VERSION="19">
<COLLECTION ENTRIES="2">
<ENTRY TITLE="Life Pulls You" ARTIST="AceMo"><LOCATION DIR="/:Users/:Ewen/:Documents/:" FILE="02 Life Pulls You.mp3" VOLUME="Macintosh HD" VOLUMEID="Macintosh HD"></LOCATION></ENTRY>
<ENTRY TITLE="Rave Angel" ARTIST="AceMo"><LOCATION DIR="/:Users/:Ewen/:Documents/:" FILE="06 Rave Angel.mp3" VOLUME="Macintosh HD" VOLUMEID="Macintosh HD"></LOCATION></ENTRY>
</COLLECTION>
<PLAYLISTS><NODE TYPE="FOLDER" NAME="$ROOT"><SUBNODES COUNT="1"><NODE TYPE="PLAYLIST" NAME="mix prep"><PLAYLIST ENTRIES="2" TYPE="LIST" UUID="abc">
<ENTRY><PRIMARYKEY TYPE="TRACK" KEY="Macintosh HD/:Users/:Ewen/:Documents/:06 Rave Angel.mp3"></PRIMARYKEY></ENTRY>
<ENTRY><PRIMARYKEY TYPE="TRACK" KEY="Macintosh HD/:Users/:Ewen/:Documents/:02 Life Pulls You.mp3"></PRIMARYKEY></ENTRY>
</PLAYLIST></NODE></SUBNODES></NODE></PLAYLISTS>
</NML>`;

const TRAKTOR_HISTORY_NML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<NML VERSION="19">
<COLLECTION ENTRIES="2">
<ENTRY TITLE="Check the Technique" ARTIST="Delroy Edwards"><LOCATION DIR="/:tracks/:" FILE="a.mp3" VOLUME="Macintosh HD" VOLUMEID="Macintosh HD"></LOCATION></ENTRY>
<ENTRY TITLE="Momoweb" ARTIST="Bakongo"><LOCATION DIR="/:tracks/:" FILE="b.mp3" VOLUME="Macintosh HD" VOLUMEID="Macintosh HD"></LOCATION></ENTRY>
</COLLECTION>
<PLAYLISTS><NODE TYPE="FOLDER" NAME="$ROOT"><SUBNODES COUNT="1"><NODE TYPE="PLAYLIST" NAME="HISTORY"><PLAYLIST ENTRIES="2" TYPE="PROTOCOL" UUID="abc">
<ENTRY><PRIMARYKEY TYPE="TRACK" KEY="Macintosh HD/:tracks/:a.mp3"></PRIMARYKEY><EXTENDEDDATA DECK="0" DURATION="13.9" EXTENDEDTYPE="HistoryData" PLAYEDPUBLIC="0" STARTDATE="1" STARTTIME="72098"></EXTENDEDDATA></ENTRY>
<ENTRY><PRIMARYKEY TYPE="TRACK" KEY="Macintosh HD/:tracks/:b.mp3"></PRIMARYKEY><EXTENDEDDATA DECK="0" DURATION="293.1" EXTENDEDTYPE="HistoryData" PLAYEDPUBLIC="1" STARTDATE="1" STARTTIME="72112"></EXTENDEDDATA></ENTRY>
</PLAYLIST></NODE></SUBNODES></NODE></PLAYLISTS>
</NML>`;

const REKORDBOX_EXPORT = [
  '#\tArtwork\tTrack Title\tArtist\tAlbum\tGenre\tBPM\tRating\tTime\tKey\tDate Added',
  '1\t\tCrush Mood\tLone\tAmbivert Tools\tElectronic\t124.00\t\t06:37\t12A\t2019-03-01',
  '2\t\tPlateau\tMori Ra\tThe Brasserie\t\t122.00\t\t07:22\t12A\t2019-03-01',
].join('\n');

describe('parseTracklist', () => {
  it('resolves Traktor playlist entries against the collection, in playlist order, without timestamps', () => {
    const entries = parseTracklist(TRAKTOR_PLAYLIST_NML, 'mix prep.nml');
    expect(
      entries.map((entry) => [entry.title, entry.artist, entry.startSec]),
    ).toEqual([
      ['Rave Angel', 'AceMo', null],
      ['Life Pulls You', 'AceMo', null],
    ]);
  });

  it('drops un-played cue-ups from a Traktor history export and times tracks from the first real play', () => {
    const entries = parseTracklist(TRAKTOR_HISTORY_NML, 'history.nml');
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      title: 'Momoweb',
      artist: 'Bakongo',
      startSec: 0,
    });
  });

  it('sums Rekordbox export durations into cumulative start times', () => {
    const entries = parseTracklist(REKORDBOX_EXPORT, 'playlist.txt');
    expect(entries).toEqual([
      expect.objectContaining({
        title: 'Crush Mood',
        artist: 'Lone',
        startSec: 0,
      }),
      expect.objectContaining({
        title: 'Plateau',
        artist: 'Mori Ra',
        startSec: 6 * 60 + 37,
      }),
    ]);
  });

  it('pulls a leading or trailing timestamp off plain-text lines', () => {
    const entries = parseTracklist(
      '12:14 Artist – Track One\nArtist – Track Two – 18:02\nNo timestamp here',
      'tracklist.txt',
    );
    expect(entries.map((entry) => [entry.title, entry.startSec])).toEqual([
      ['Artist – Track One', 12 * 60 + 14],
      ['Artist – Track Two', 18 * 60 + 2],
      ['No timestamp here', null],
    ]);
  });
});

describe('readTracklistFile', () => {
  it('decodes a UTF-16LE file with a byte-order mark, as Rekordbox exports', async () => {
    const text = 'Track Title\tArtist\nHello\tWorld';
    const bytes = new Uint8Array(2 + text.length * 2);
    bytes[0] = 0xff;
    bytes[1] = 0xfe;
    for (let i = 0; i < text.length; i++) {
      bytes[2 + i * 2] = text.charCodeAt(i) & 0xff;
      bytes[2 + i * 2 + 1] = text.charCodeAt(i) >> 8;
    }
    const file = new File([bytes], 'export.txt');
    expect(await readTracklistFile(file)).toBe(text);
  });

  it('decodes a plain UTF-8 file', async () => {
    const file = new File(['12:14 Track'], 'tracklist.txt');
    expect(await readTracklistFile(file)).toBe('12:14 Track');
  });
});

describe('real DJ software exports (tracklister fixtures)', () => {
  it('imports a Rekordbox history export (UTF-16LE), summing track lengths into start times', async () => {
    const entries = await importFixture('rekordbox-history-example.txt');
    expect(entries).toHaveLength(28);
    expect(entries[0]).toMatchObject({
      title: 'Crush Mood',
      artist: 'Lone',
      startSec: 0,
    });
    expect(entries[1]).toMatchObject({
      title: 'Plateau',
      artist: 'Mori Ra',
      startSec: 6 * 60 + 37,
    });
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i]!.startSec).toBeGreaterThan(entries[i - 1]!.startSec!);
    }
  });

  it('imports a Rekordbox playlist export (UTF-16LE)', async () => {
    const entries = await importFixture('rekordbox-playlist-example.txt');
    expect(entries).toHaveLength(10);
    expect(entries[0]).toMatchObject({
      title: 'Door Girl Interlude V',
      artist: 'Door Girl',
      startSec: 0,
    });
    expect(entries[1]!.startSec).toBe(54);
  });

  it('imports a Traktor playlist NML, resolving titles/artists via the collection', async () => {
    const entries = await importFixture('traktor-playlist-example.nml');
    expect(entries).toHaveLength(58);
    expect(entries.every((entry) => entry.startSec === null)).toBe(true);
    expect(
      entries.every(
        (entry) => entry.title && !entry.title.startsWith('Track '),
      ),
    ).toBe(true);
  });

  it('imports a Traktor history NML, dropping un-played cue-ups and timing from first real play', async () => {
    const entries = await importFixture('traktor-history-example.nml');
    expect(entries).toHaveLength(30);
    expect(entries[0]).toMatchObject({
      title: 'Check the Technique',
      artist: 'Trackstars',
      startSec: 0,
    });
    for (const entry of entries) {
      expect(entry.startSec).not.toBeNull();
      expect(entry.startSec!).toBeGreaterThanOrEqual(0);
    }
  });
});
