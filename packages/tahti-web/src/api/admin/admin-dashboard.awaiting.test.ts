import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchAdminDashboard } from './admin-dashboard';

/** Answers each dashboard request by its path; `awaiting` is the reply to
 * the awaitingReply=true ticket query. */
function stubDashboardApi(awaiting: unknown | Error) {
  vi.stubEnv('DEV', false);
  vi.stubEnv('VITE_ALLOW_MOCK_FALLBACK', '0');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const json = (body: unknown) =>
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      if (url.includes('awaitingReply=true')) {
        if (awaiting instanceof Error) {
          throw awaiting;
        }
        return json(awaiting);
      }
      if (url.includes('/support/tickets')) {
        return json({ total: 7, tickets: [] });
      }
      if (url.includes('/stats/members')) {
        return json({ total: 10 });
      }
      if (url.includes('/admin/streams')) {
        return json({ count: 0, streams: [] });
      }
      if (url.includes('/beta/applications')) {
        return json({ applications: [] });
      }
      if (url.includes('/transparency/ytd')) {
        return json({ runningSurplus: '0', byCategory: {} });
      }
      if (url.includes('/stats/system-health')) {
        return json({});
      }
      return json([]);
    }),
  );
}

describe('fetchAdminDashboard tickets awaiting a reply', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('reports how many tickets wait on the board', async () => {
    stubDashboardApi({ total: 3, tickets: [{ awaitingReply: true }] });
    const { data } = await fetchAdminDashboard();
    expect(data.kpis.openTickets).toBe(7);
    expect(data.kpis.ticketsAwaitingReply).toBe(3);
  });

  it('reports zero when nothing is waiting', async () => {
    stubDashboardApi({ total: 0, tickets: [] });
    const { data } = await fetchAdminDashboard();
    expect(data.kpis.ticketsAwaitingReply).toBe(0);
  });

  it('leaves the count out when the API ignored the filter', async () => {
    stubDashboardApi({ total: 42, tickets: [{ awaitingReply: false }] });
    const { data } = await fetchAdminDashboard();
    expect(data.kpis.openTickets).toBe(7);
    expect(data.kpis.ticketsAwaitingReply).toBeUndefined();
  });

  it('keeps the rest of the dashboard when that one request fails', async () => {
    stubDashboardApi(new Error('boom'));
    const { data } = await fetchAdminDashboard();
    expect(data.kpis.activeMembers).toBe(10);
    expect(data.kpis.ticketsAwaitingReply).toBeUndefined();
  });
});
