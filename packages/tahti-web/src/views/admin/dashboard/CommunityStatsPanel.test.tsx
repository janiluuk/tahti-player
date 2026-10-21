// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../../api/admin';
import { CommunityStatsPanel } from './CommunityStatsPanel';

describe('summarizeChatSeries', () => {
  it('totals the days and finds the busiest one', () => {
    expect(
      admin.summarizeChatSeries([
        { date: '2026-09-27', count: 4 },
        { date: '2026-09-28', count: 19 },
        { date: '2026-09-29', count: 7 },
      ]),
    ).toEqual({ total: 30, busiest: { date: '2026-09-28', count: 19 } });
    expect(
      admin.summarizeChatSeries([{ date: '2026-09-29', count: 0 }]),
    ).toEqual({ total: 0, busiest: null });
  });
});

describe('fetchAdminCommunityStats', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps the chat numbers when the mail stats fail', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/stats/mail')) {
        return new Response('{}', { status: 503 });
      }
      if (url.includes('chat-timeseries')) {
        return new Response(
          JSON.stringify({
            days: 30,
            series: [{ date: '2026-09-29', count: 5 }],
          }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ last24h: 5 }), { status: 200 });
    });
    await expect(admin.fetchAdminCommunityStats()).resolves.toEqual({
      chatLast24h: 5,
      chatSeries: [{ date: '2026-09-29', count: 5 }],
      mail: null,
    });
  });
});

describe('CommunityStatsPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows chat and mailbox numbers, with dashes for what is missing', async () => {
    vi.spyOn(admin, 'fetchAdminCommunityStats').mockResolvedValue({
      chatLast24h: 184,
      chatSeries: [
        { date: '2026-09-28', count: 1200 },
        { date: '2026-09-29', count: 300 },
      ],
      mail: null,
    });
    await act(async () => {
      render(<CommunityStatsPanel />);
    });
    expect(screen.getByText('184')).toBeTruthy();
    expect(screen.getByText('1 500')).toBeTruthy();
    expect(screen.getByText(/Busiest .*: 1 200/)).toBeTruthy();
    expect(screen.getAllByText('Mail stats unavailable')).toHaveLength(2);
  });
});
