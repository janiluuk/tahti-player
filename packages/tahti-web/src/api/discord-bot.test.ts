import { afterEach, describe, expect, it, vi } from 'vitest';

import { restartDiscordBot } from './discord-bot';

describe('restartDiscordBot', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('asks the API to restart the bot', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ ok: true, action: 'restart', container: 'bot' }),
          { status: 200 },
        ),
      );
    await expect(restartDiscordBot()).resolves.toEqual({ ok: true });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/admin/discord-bot/restart',
    );
    expect(fetchSpy.mock.calls[0]![1]!.method).toBe('POST');
  });

  it('passes on why the restart failed', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          error: 'Discord bot container is not currently running',
        }),
        { status: 409 },
      ),
    );
    await expect(restartDiscordBot()).resolves.toEqual({
      ok: false,
      error: 'Discord bot container is not currently running',
    });
  });
});
