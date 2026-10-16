import { afterEach, describe, expect, it } from 'vitest';

import { mockChatHistory } from './mock';
import {
  appendMockChatMessage,
  mockChatStoreMessages,
  resetMockChatStore,
} from './mock-chat-store';

afterEach(() => {
  resetMockChatStore();
});

describe('mock chat store', () => {
  it('keeps sent messages on the history for that slug', () => {
    appendMockChatMessage('demo', {
      handle: 'listener',
      text: 'hello after reload',
      ts: 1,
    });
    expect(mockChatStoreMessages('demo').map((m) => m.text)).toEqual([
      'hello after reload',
    ]);
    expect(
      mockChatHistory('demo').some((m) => m.text === 'hello after reload'),
    ).toBe(true);
  });
});
