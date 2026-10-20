import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import type { AuthSessionStorage } from './types';

type StoredShape = {
  refreshToken?: string | null;
};

export function createNodeConfigFileStorage(
  filePath: string,
): AuthSessionStorage {
  const read = (): StoredShape => {
    try {
      const raw = JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
      return raw && typeof raw === 'object' ? (raw as StoredShape) : {};
    } catch {
      return {};
    }
  };

  const write = (next: StoredShape) => {
    mkdirSync(dirname(filePath), { recursive: true, mode: 0o700 });
    const existing = read();
    const merged = { ...existing, ...next };
    if (!merged.refreshToken) {
      delete merged.refreshToken;
    }
    writeFileSync(filePath, `${JSON.stringify(merged, null, 2)}\n`, {
      mode: 0o600,
    });
  };

  return {
    getRefreshToken: () => {
      const token = read().refreshToken;
      return typeof token === 'string' && token ? token : null;
    },
    setRefreshToken: (token) => {
      write({ refreshToken: token });
    },
  };
}
