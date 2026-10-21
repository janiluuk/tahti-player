import { describe, expect, it } from 'vitest';

import { buildIpcCommand, buildMpvArgs } from './mpv.mjs';

describe('mpv helpers', () => {
  it('builds idle no-video IPC args', () => {
    expect(buildMpvArgs('/tmp/mpv.sock')).toEqual([
      '--no-video',
      '--idle=yes',
      '--force-window=no',
      '--really-quiet',
      '--input-ipc-server=/tmp/mpv.sock',
    ]);
  });

  it('serializes IPC commands as JSON lines', () => {
    expect(buildIpcCommand(['loadfile', 'https://x/a.mp3', 'replace'], 3)).toBe(
      '{"command":["loadfile","https://x/a.mp3","replace"],"request_id":3}\n',
    );
    expect(buildIpcCommand(['set_property', 'pause', true])).toBe(
      '{"command":["set_property","pause",true]}\n',
    );
  });
});
