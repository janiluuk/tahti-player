import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  RECIPIENT_UNAVAILABLE_MESSAGE,
  sendDm,
  startConversation,
} from './messages';

const unavailable = () =>
  new Response(
    JSON.stringify({
      error: 'This account is no longer available',
      code: 'recipient_unavailable',
    }),
    { status: 403 },
  );

describe('DM send and start errors', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('flags a deleted or suspended recipient on send', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(unavailable());
    await expect(sendDm('c1', 'hi')).resolves.toEqual({
      ok: false,
      error: RECIPIENT_UNAVAILABLE_MESSAGE,
      recipientUnavailable: true,
    });
  });

  it('flags a deleted or suspended recipient on start', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(unavailable());
    await expect(startConversation('gone')).resolves.toEqual({
      ok: false,
      error: RECIPIENT_UNAVAILABLE_MESSAGE,
      recipientUnavailable: true,
    });
  });

  it('passes other errors through unchanged', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
      }),
    );
    await expect(startConversation('nobody')).resolves.toEqual({
      ok: false,
      error: 'User not found',
    });
  });
});
