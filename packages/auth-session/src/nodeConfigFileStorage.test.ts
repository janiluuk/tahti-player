import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createNodeConfigFileStorage } from './nodeConfigFileStorage';

describe('createNodeConfigFileStorage', () => {
  let dir: string;
  let path: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'auth-session-'));
    path = join(dir, 'tahti', 'config.json');
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('persists refresh tokens at mode 0600 and clears them', async () => {
    const storage = createNodeConfigFileStorage(path);
    expect(await storage.getRefreshToken()).toBeNull();
    await storage.setRefreshToken('refresh-1');
    expect(await storage.getRefreshToken()).toBe('refresh-1');
    expect((await stat(path)).mode & 0o777).toBe(0o600);
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual({
      refreshToken: 'refresh-1',
    });
    await storage.setRefreshToken(null);
    expect(await storage.getRefreshToken()).toBeNull();
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual({});
  });
});
