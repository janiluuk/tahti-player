import { describe, expect, it } from 'vitest';

import {
  extractApiPaths,
  isServed,
  normalizePath,
} from './check-api-routes.mjs';

const served = [
  '/api/me/sound/{id}/shares',
  '/api/me/rtmp-targets/{id}',
  '/api/admin/files/bulk-delete',
].map(normalizePath);

describe('check-api-routes', () => {
  it('matches a template path against the served one', () => {
    expect(
      isServed(
        normalizePath('/api/me/sound/${encodeURIComponent(id)}/shares'),
        served,
      ),
    ).toBe(true);
    expect(
      isServed(normalizePath('/api/admin/files/bulk-delete?x=1'), served),
    ).toBe(true);
  });

  it('accepts the start of a served path, for paths built in pieces', () => {
    expect(isServed(normalizePath('/api/me/rtmp-targets'), served)).toBe(true);
  });

  it('reports a path the server does not have', () => {
    expect(isServed(normalizePath('/api/admin/i18n/languages'), served)).toBe(
      false,
    );
    expect(
      isServed(normalizePath('/api/me/sound/${id}/shares/extra'), served),
    ).toBe(false);
  });

  it('finds quoted and template paths with their line', () => {
    const source =
      "const a = '/api/me/blocks';\nconst b = `/api/me/blocks/${name}`;\n";
    expect(extractApiPaths(source)).toEqual([
      { raw: '/api/me/blocks', line: 1 },
      { raw: '/api/me/blocks/${name}', line: 2 },
    ]);
  });
});
