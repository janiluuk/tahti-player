/**
 * What the chat panel should do besides showing the sentence: offer the
 * artist's subscribe page, or show the captcha again before rejoining.
 */
export type ChatErrorAction = 'subscribe' | 'captcha' | 'chat_off' | null;

export type ChatError = { message: string; action: ChatErrorAction };

export const CHAT_OFF_MESSAGE = 'The artist has turned chat off.';

const GENERIC_MESSAGE =
  'Something went wrong with chat. Try again in a moment.';

// Keys are the `error` strings the chat token and publish routes send
// (../tahti-org apps/api/src/routes/chat/token.ts and message.ts).
const KNOWN: Record<string, ChatError> = {
  chat_disabled: { message: CHAT_OFF_MESSAGE, action: 'chat_off' },
  subscribers_only: {
    message: 'Only fan subscribers can post in this chat.',
    action: 'subscribe',
  },
  fan_chat_required: {
    message: 'The fan room is for fan subscribers.',
    action: 'subscribe',
  },
  captcha_required: {
    message: 'Please confirm you are not a bot again to keep chatting.',
    action: 'captcha',
  },
  'hcaptcha verification failed': {
    message: 'The captcha check did not go through. Please try it again.',
    action: 'captcha',
  },
  banned: {
    message: 'You can no longer post in this chat.',
    action: null,
  },
  'too many requests': {
    message: 'Too many tries. Wait a minute and try again.',
    action: null,
  },
  'channel not found': {
    message: 'This channel does not exist any more.',
    action: null,
  },
};

function knownError(err: unknown): ChatError | undefined {
  const code = err instanceof Error ? err.message : err;
  return typeof code === 'string'
    ? KNOWN[code.trim().toLowerCase()]
    : undefined;
}

/** True when the server gave a reason of its own, as opposed to a network
 * failure or an outage that a retry may get past. */
export function isKnownChatError(err: unknown): boolean {
  return knownError(err) !== undefined;
}

/** Turns a chat API error code into a sentence; never echoes the raw code. */
export function chatErrorFor(
  err: unknown,
  fallback: string = GENERIC_MESSAGE,
): ChatError {
  return knownError(err) ?? { message: fallback, action: null };
}
