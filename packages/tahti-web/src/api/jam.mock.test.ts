import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createJam,
  fetchJam,
  joinJam,
  pushJamState,
  removeJamParticipant,
  setJamParticipantControl,
} from './jam';
import {
  MOCK_JAM_DEMO_CODE,
  resetMockJamSessions,
  setMockJamEnabled,
} from './jam.mock';

describe('jam in the offline mock app', () => {
  afterEach(() => {
    resetMockJamSessions();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('joins the stable demo jam hosted by another artist without the network', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const session = await joinJam(MOCK_JAM_DEMO_CODE);

    expect(session.code).toBe(MOCK_JAM_DEMO_CODE);
    expect(session.participants.map((p) => p.role)).toEqual(['HOST', 'GUEST']);
    expect(session.hostUserId).not.toBe('mock-1');
    expect(await fetchJam(session.id)).toEqual(session);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects unknown jam codes in mock mode', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    await expect(joinJam('NOT-A-JAM')).rejects.toThrow('Jam not found');
  });

  it('hosts a created jam and keeps host changes', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');

    const created = await createJam('demo-collection');
    expect(created.code).toBe(MOCK_JAM_DEMO_CODE);
    expect(created.hostUserId).toBe('mock-1');
    expect(await joinJam(created.code)).toEqual(created);

    const paused = await pushJamState(created.id, {
      isPlaying: false,
      currentTrack: created.currentTrack,
      positionSec: 10,
    });
    expect(paused.isPlaying).toBe(false);
    expect(paused.positionSec).toBe(10);
  });

  it('lets the host change guest control on the demo jam', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');

    const demo = await joinJam(MOCK_JAM_DEMO_CODE);
    const guest = demo.participants.find((p) => p.role === 'GUEST')!;
    const granted = await setJamParticipantControl(demo.id, guest.userId, true);
    expect(
      granted?.participants.find((p) => p.userId === guest.userId)?.canControl,
    ).toBe(true);
    const removed = await removeJamParticipant(demo.id, guest.userId);
    expect(removed?.participants.some((p) => p.userId === guest.userId)).toBe(
      false,
    );
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
