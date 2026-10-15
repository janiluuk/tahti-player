import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearUnreadableIcyStreams, readIcyStreamTitle } from './radio-sources';

function icyResponse(title: string) {
  const metaint = 4;
  const meta = new TextEncoder().encode(`StreamTitle='${title}';`);
  const blocks = Math.ceil(meta.length / 16);
  const body = new Uint8Array(metaint + 1 + blocks * 16);
  body[metaint] = blocks;
  body.set(meta, metaint + 1);
  return new Response(body, { headers: { 'icy-metaint': String(metaint) } });
}

describe('readIcyStreamTitle', () => {
  beforeEach(() => {
    clearUnreadableIcyStreams();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the title the stream announces', async () => {
    const fetchMock = vi.fn().mockResolvedValue(icyResponse('Viivi — Usa'));
    vi.stubGlobal('fetch', fetchMock);
    expect(await readIcyStreamTitle('https://example.test/a')).toBe(
      'Viivi — Usa',
    );
  });

  it('stops asking a stream the browser cannot read', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('CORS'));
    vi.stubGlobal('fetch', fetchMock);
    expect(await readIcyStreamTitle('https://example.test/b')).toBeNull();
    expect(await readIcyStreamTitle('https://example.test/b')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('stops asking a stream that sends no metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('audio'));
    vi.stubGlobal('fetch', fetchMock);
    expect(await readIcyStreamTitle('https://example.test/c')).toBeNull();
    expect(await readIcyStreamTitle('https://example.test/c')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('asks again after a slow stream timed out', async () => {
    const fetchMock = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    expect(await readIcyStreamTitle('https://example.test/d', 5)).toBeNull();
    expect(await readIcyStreamTitle('https://example.test/d', 5)).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
