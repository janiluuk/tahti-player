import { describe, expect, it } from 'vitest';

import { chatErrorFor } from './chatErrors';

describe('chatErrorFor', () => {
  it.each([
    ['chat_disabled', 'The artist has turned chat off.', 'chat_off'],
    [
      'subscribers_only',
      'Only fan subscribers can post in this chat.',
      'subscribe',
    ],
    ['fan_chat_required', 'The fan room is for fan subscribers.', 'subscribe'],
    [
      'captcha_required',
      'Please confirm you are not a bot again to keep chatting.',
      'captcha',
    ],
    [
      'hCaptcha verification failed',
      'The captcha check did not go through. Please try it again.',
      'captcha',
    ],
    ['banned', 'You can no longer post in this chat.', null],
  ])('turns %s into a sentence', (code, message, action) => {
    expect(chatErrorFor(new Error(code))).toEqual({ message, action });
  });

  it('never shows an unknown code', () => {
    const result = chatErrorFor(new Error('weird_code'));
    expect(result.message).not.toContain('weird_code');
    expect(result.message).toBe(
      'Something went wrong with chat. Try again in a moment.',
    );
    expect(result.action).toBe(null);
  });

  it('uses the caller fallback for unknown codes and non-errors', () => {
    expect(chatErrorFor('/api/chat/x/token → 500', 'Could not join.')).toEqual({
      message: 'Could not join.',
      action: null,
    });
    expect(chatErrorFor(undefined, 'Could not join.').message).toBe(
      'Could not join.',
    );
  });
});
