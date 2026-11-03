import { describe, expect, it } from 'vitest';

import type { ChatMessage } from '../api/types';
import {
  CHAT_HISTORY_LIMIT,
  chatActivity,
  chatActivityLabel,
} from './chatActivity';

const HOUR = 3_600_000;
const NOW = Date.UTC(2026, 10, 3, 12);

const message = (hoursAgo: number, system = false): ChatMessage => ({
  id: `m-${hoursAgo}-${String(system)}`,
  handle: 'fan',
  text: 'hi',
  ts: NOW - hoursAgo * HOUR,
  system,
});

describe('chatActivity', () => {
  it('counts listener messages from the last 24 hours only', () => {
    const activity = chatActivity(
      [message(1), message(5), message(23), message(25), message(2, true)],
      NOW,
    );
    expect(activity).toEqual({
      count: 3,
      atLeast: false,
      lastTs: NOW - HOUR,
    });
    expect(chatActivityLabel(activity)).toBe('3 messages');
  });

  it('marks a full history page as a lower bound', () => {
    const full = Array.from({ length: CHAT_HISTORY_LIMIT }, () => message(1));
    const activity = chatActivity(full, NOW);
    expect(activity.atLeast).toBe(true);
    expect(chatActivityLabel(activity)).toBe('100+ messages');
  });

  it('reads a quiet room as no messages', () => {
    expect(chatActivityLabel(chatActivity([message(30)], NOW))).toBe(
      'No messages',
    );
  });
});
