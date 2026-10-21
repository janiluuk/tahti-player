import { afterEach, describe, expect, it, vi } from 'vitest';

import { removeJamParticipant, setJamParticipantControl } from './jam';

describe('setJamParticipantControl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('patches the participant and returns the updated session', async () => {
    const session = { id: 's1', participants: [] };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify(session), { status: 200 }),
      );

    await expect(setJamParticipantControl('s1', 'u 2', true)).resolves.toEqual(
      session,
    );
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/tahti-api/api/v1/jam/s1/participants/u%202');
    expect(init?.method).toBe('PATCH');
    expect(JSON.parse(String(init?.body))).toEqual({ canControl: true });
  });

  it('resolves to null when the API refuses or lacks the route', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 }),
    );
    await expect(
      setJamParticipantControl('s1', 'u2', false),
    ).resolves.toBeNull();
  });
});

describe('removeJamParticipant', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deletes the participant and returns the updated session', async () => {
    const session = { id: 's1', participants: [] };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify(session), { status: 200 }),
      );

    await expect(removeJamParticipant('s1', 'u 2')).resolves.toEqual(session);
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/tahti-api/api/v1/jam/s1/participants/u%202');
    expect(init?.method).toBe('DELETE');
  });

  it('resolves to null when the API refuses or lacks the route', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 }),
    );
    await expect(removeJamParticipant('s1', 'u2')).resolves.toBeNull();
  });
});
