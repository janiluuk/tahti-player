import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createJamClient,
  JamUnpairedError,
  readPairingToken,
} from './jamClient';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('readPairingToken', () => {
  it('keeps the code from the QR link and takes it out of the address bar', () => {
    history.replaceState(null, '', '/remote#token=abc123');
    expect(readPairingToken()).toBe('abc123');
    expect(window.location.hash).toBe('');
    expect(window.location.pathname).toBe('/remote');
    expect(readPairingToken()).toBe('abc123');
  });

  it('has no code before the phone is paired', () => {
    history.replaceState(null, '', '/remote');
    expect(readPairingToken()).toBeNull();
  });
});

describe('createJamClient', () => {
  it('sends the pairing code and posts actions as JSON', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await createJamClient('abc123').seek(42);
    expect(fetchMock).toHaveBeenCalledWith('/api/playback/seek', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer abc123',
        'Content-Type': 'application/json',
      },
      body: '{"seconds":42}',
    });
    expect(createJamClient('a b').eventsUrl).toBe('/api/events?token=a%20b');
  });

  it('reports an unpaired phone and passes on other errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 401 })),
    );
    await expect(createJamClient('old').queue()).rejects.toBeInstanceOf(
      JamUnpairedError,
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ error: 'mode must be off, all or one.' }),
            {
              status: 500,
            },
          ),
      ),
    );
    await expect(createJamClient('ok').repeat('off')).rejects.toThrow(
      'mode must be off, all or one.',
    );
  });
});
