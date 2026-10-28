import { afterEach, describe, expect, it, vi } from 'vitest';

import { probeRadioStream, testRadioStream } from './radio-sources';

const MASTER = [
  '#EXTM3U',
  '#EXT-X-STREAM-INF:BANDWIDTH=192000,CODECS="mp3"',
  'stream-mp3-192.m3u8',
].join('\n');

function respond(status: number, body = '', contentType = 'audio/mpeg') {
  return new Response(body, {
    status,
    headers: { 'content-type': contentType },
  });
}

function stubFetch(responses: Record<string, () => Response>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const make = responses[url];
    if (!make) {
      throw new TypeError('Failed to fetch');
    }
    return make();
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('probeRadioStream', () => {
  it('reports an HTTP error status', async () => {
    stubFetch({ 'https://radio.example/live': () => respond(503) });

    await expect(
      probeRadioStream('https://radio.example/live'),
    ).resolves.toEqual({
      state: 'failed',
      failure: { reason: 'http', status: 503 },
    });
  });

  it('follows an HLS master playlist to its first variant', async () => {
    const fetchMock = stubFetch({
      'https://cdn.example/hls/master.m3u8': () =>
        respond(200, MASTER, 'application/vnd.apple.mpegurl'),
      'https://cdn.example/hls/stream-mp3-192.m3u8': () => respond(404),
    });

    await expect(
      probeRadioStream('https://cdn.example/hls/master.m3u8'),
    ).resolves.toEqual({
      state: 'failed',
      failure: { reason: 'http', status: 404 },
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('is ok when the stream answers', async () => {
    stubFetch({ 'https://radio.example/live': () => respond(200, 'audio') });

    await expect(
      probeRadioStream('https://radio.example/live'),
    ).resolves.toEqual({ state: 'ok', status: 200 });
  });

  it('cannot tell when the browser blocks the request', async () => {
    stubFetch({});

    await expect(
      probeRadioStream('https://radio.example/live'),
    ).resolves.toEqual({ state: 'unknown' });
  });
});

describe('testRadioStream', () => {
  it('keeps the dialog messages', async () => {
    stubFetch({ 'https://radio.example/live': () => respond(404) });

    await expect(
      testRadioStream('https://radio.example/live'),
    ).resolves.toEqual({
      ok: false,
      status: 404,
      message: 'Stream returned HTTP 404.',
    });
  });
});
