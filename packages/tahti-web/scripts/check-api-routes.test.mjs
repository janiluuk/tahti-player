import { describe, expect, it } from 'vitest';

import {
  extractApiPaths,
  isServed,
  normalizePath,
  servedAllowances,
} from './check-api-routes.mjs';

const served = [
  '/api/me/sound/{id}/shares',
  '/api/me/rtmp-targets/{id}',
  '/api/admin/files/bulk-delete',
].map(normalizePath);

describe('check-api-routes', () => {
  it('flags allowlist entries the API serves now, but not prefixes', () => {
    const served = ['/api/me/password', '/api/me/sessions/\u0000'];
    expect(
      servedAllowances(
        ['/api/me/password', '/api/me/sessions/:param', '/api/me', '/api/x'],
        served,
      ),
    ).toEqual(['/api/me/password', '/api/me/sessions/:param']);
  });

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

  it('does not let a param swallow a different literal segment', () => {
    const withShares = [
      normalizePath('/api/me/sound/shares/{id}'),
      normalizePath('/api/me/sound/{id}/shares'),
    ];
    expect(
      isServed(
        normalizePath('/api/me/sound/${id}/group-membership'),
        withShares,
      ),
    ).toBe(false);
    expect(
      servedAllowances(['/api/me/sound/:param/group-membership'], withShares),
    ).toEqual([]);
  });

  it('allows a caller param for a concrete action, or a concrete slug for {slug}', () => {
    const channelRoutes = [
      normalizePath('/api/channels/{slug}/pause'),
      normalizePath('/api/channels/{slug}'),
    ];
    expect(
      isServed(
        normalizePath('/api/channels/${slug}/${action}'),
        channelRoutes,
      ),
    ).toBe(true);
    expect(
      isServed(normalizePath('/api/channels/tahti-radio'), channelRoutes),
    ).toBe(true);
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
