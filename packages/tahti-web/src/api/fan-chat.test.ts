import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MOCK_FAN_CHAT_TOKEN, requestFanChatToken } from './fan-chat';

describe('requestFanChatToken in the offline mock app', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('hands out a mock token for the fan channel instead of refusing', async () => {
    await expect(requestFanChatToken('night-drive')).resolves.toEqual({
      ok: true,
      data: {
        token: MOCK_FAN_CHAT_TOKEN,
        handle: 'You',
        channel: 'channel:night-drive:fans',
      },
    });
  });
});
