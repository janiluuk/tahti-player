import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  historyPath,
  readShellHistory,
  writeShellHistory,
} from './history-file.mjs';
import { HISTORY_LIMIT } from './state.mjs';

const API_URL = 'https://api.tahti.live';

const LIBRARY_TRACK = {
  id: 'snd_1',
  title: 'Night Drive',
  artist: '',
  durationSec: 245,
  kind: 'track',
  source: 'library',
  url: 'https://storage.example/signed?X-Amz-Signature=abc',
};

const LIKED_TRACK = {
  id: 'snd_2',
  title: 'Dawn',
  artist: 'Aurora',
  durationSec: null,
  kind: 'track',
  source: 'likes',
  url: 'https://cdn.example/dawn.mp3',
};

describe('shell history file', () => {
  let folder: string;
  let env: Record<string, string>;

  beforeEach(async () => {
    folder = await mkdtemp(join(tmpdir(), 'tahti-history-'));
    env = { XDG_CONFIG_HOME: folder };
  });

  afterEach(async () => {
    await rm(folder, { recursive: true, force: true });
  });

  it('lives next to the saved login', () => {
    expect(historyPath(env)).toBe(join(folder, 'tahti', 'shell-history.json'));
    expect(historyPath({ HOME: '/home/kari' })).toBe(
      '/home/kari/.config/tahti/shell-history.json',
    );
    expect(historyPath({})).toBeNull();
  });

  it('round-trips the history without signed library links', async () => {
    writeShellHistory(API_URL, [LIBRARY_TRACK, LIKED_TRACK], env);

    expect(readShellHistory(API_URL, env)).toEqual([
      {
        id: 'snd_1',
        title: 'Night Drive',
        artist: '',
        durationSec: 245,
        kind: 'track',
        source: 'library',
      },
      LIKED_TRACK,
    ]);
    const path = join(folder, 'tahti', 'shell-history.json');
    expect(await readFile(path, 'utf8')).not.toContain('X-Amz-Signature');
    expect((await stat(path)).mode & 0o777).toBe(0o600);
  });

  it('keeps at most the history limit', () => {
    const many = Array.from({ length: HISTORY_LIMIT + 5 }, (_, index) => ({
      ...LIKED_TRACK,
      id: `snd_${index}`,
    }));
    writeShellHistory(API_URL, many, env);
    const history = readShellHistory(API_URL, env);
    expect(history).toHaveLength(HISTORY_LIMIT);
    expect(history[0].id).toBe('snd_0');
  });

  it('ignores history saved against another API', () => {
    writeShellHistory('http://localhost:3000', [LIKED_TRACK], env);
    expect(readShellHistory(API_URL, env)).toEqual([]);
  });

  it('gives an empty history for a missing or broken file and skips bad rows', async () => {
    expect(readShellHistory(API_URL, env)).toEqual([]);
    writeShellHistory(API_URL, [], env);
    const path = join(folder, 'tahti', 'shell-history.json');
    await writeFile(path, '{not json');
    expect(readShellHistory(API_URL, env)).toEqual([]);
    await writeFile(
      path,
      JSON.stringify({
        apiUrl: API_URL,
        tracks: [
          { id: 'radio', title: 'Tahti Radio', kind: 'live', source: 'radio' },
          { title: 'No id', kind: 'track', source: 'likes' },
          LIKED_TRACK,
        ],
      }),
    );
    expect(readShellHistory(API_URL, env)).toEqual([LIKED_TRACK]);
  });

  it('does not throw when the config folder cannot be written', async () => {
    const blocker = join(folder, 'file');
    await writeFile(blocker, '');
    expect(() =>
      writeShellHistory(API_URL, [LIKED_TRACK], { XDG_CONFIG_HOME: blocker }),
    ).not.toThrow();
  });
});
