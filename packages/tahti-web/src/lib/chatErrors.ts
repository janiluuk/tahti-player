import type { TFunction } from '@tahti-player/i18n';

import { webT } from './webT';

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
// (../tahti-org apps/api/src/routes/chat/token.ts, message.ts and react.ts).
function known(t: TFunction<'web'>): Record<string, ChatError> {
  return {
    chat_disabled: { message: CHAT_OFF_MESSAGE, action: 'chat_off' },
    subscribers_only: {
      message: t('chatErrors.onlyFanSubscribersCanPost'),
      action: 'subscribe',
    },
    fan_chat_required: {
      message: t('chatErrors.theFanRoomIsFor'),
      action: 'subscribe',
    },
    captcha_required: {
      message: t('chatErrors.pleaseConfirmYouAreNot'),
      action: 'captcha',
    },
    'hcaptcha verification failed': {
      message: t('chatErrors.theCaptchaCheckDidNot'),
      action: 'captcha',
    },
    banned: {
      message: t('chatErrors.youCanNoLongerPost'),
      action: null,
    },
    'too many requests': {
      message: t('chatErrors.tooManyTriesWaitA'),
      action: null,
    },
    'slow down': {
      message: t('chatErrors.slowDownAFewReactions'),
      action: null,
    },
    'channel not found': {
      message: t('chatErrors.thisChannelDoesNotExist'),
      action: null,
    },
  };
}

function knownError(err: unknown): ChatError | undefined {
  const code = err instanceof Error ? err.message : err;
  return typeof code === 'string'
    ? known(webT())[code.trim().toLowerCase()]
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
