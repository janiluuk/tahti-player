import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createJam,
  fetchJam,
  joinJam,
  pushJamState,
  removeJamParticipant,
  setJamParticipantControl,
} from './jam';
import { setMockJamEnabled } from './jam.mock';

describe('jam in the offline mock app', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('joins a jam hosted by another artist without the network', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const session = await joinJam('ABC123');

    expect(session.code).toBe('ABC123');
    expect(session.participants.map((p) => p.role)).toEqual(['HOST', 'GUEST']);
    expect(session.hostUserId).not.toBe('mock-1');
    expect(await fetchJam(session.id)).toEqual(session);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('hosts a created jam and keeps host changes', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');

    const created = await createJam('demo-collection');
    expect(created.hostUserId).toBe('mock-1');
    expect(await joinJam(created.code)).toEqual(created);

    const paused = await pushJamState(created.id, {
      isPlaying: false,
      currentTrack: created.currentTrack,
      positionSec: 10,
    });
    expect(paused.isPlaying).toBe(false);
    expect(paused.positionSec).toBe(10);

    const guest = (await joinJam('GUEST1')).participants[1]!;
    const granted = await setJamParticipantControl(
      'GUEST1',
      guest.userId,
      true,
    );
    expect(granted?.participants[1]?.canControl).toBe(true);
    const removed = await removeJamParticipant('GUEST1', guest.userId);
    expect(removed?.participants).toHaveLength(1);
  });

  it('uses the API again while a story stands in for it', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'story', code: 'STORY1' }), {
        status: 200,
      }),
    );
    setMockJamEnabled(false);
    try {
      await expect(joinJam('STORY1')).resolves.toMatchObject({ id: 'story' });
      expect(fetchSpy).toHaveBeenCalledOnce();
    } finally {
      setMockJamEnabled(true);
    }
  });
});
