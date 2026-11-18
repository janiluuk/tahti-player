import { getJson } from '../http';
import { isForceMock } from '../mode';

export type AdminMailbox = { unseen: number; total: number };

export type AdminCommunityStats = {
  chatLast24h: number | null;
  chatSeries: { date: string; count: number }[];
  mail: { hello: AdminMailbox; support: AdminMailbox } | null;
};

export function summarizeChatSeries(
  series: { date: string; count: number }[],
): {
  total: number;
  busiest: { date: string; count: number } | null;
} {
  let total = 0;
  let busiest: { date: string; count: number } | null = null;
  for (const point of series) {
    total += point.count;
    if (point.count > 0 && (!busiest || point.count > busiest.count)) {
      busiest = point;
    }
  }
  return { total, busiest };
}

export async function fetchAdminCommunityStats(
  days = 30,
): Promise<AdminCommunityStats> {
  if (isForceMock()) {
    const today = Date.UTC(2026, 8, 29);
    return {
      chatLast24h: 184,
      chatSeries: Array.from({ length: days }, (_, index) => ({
        date: new Date(today - (days - 1 - index) * 86_400_000)
          .toISOString()
          .slice(0, 10),
        count: (index * 37) % 211,
      })),
      mail: {
        hello: { unseen: 3, total: 412 },
        support: { unseen: 7, total: 1290 },
      },
    };
  }
  const [chat, series, mail] = await Promise.allSettled([
    getJson<{ last24h: number }>('/api/admin/stats/chat'),
    getJson<{ days: number; series: { date: string; count: number }[] }>(
      `/api/admin/stats/chat-timeseries?days=${days}`,
    ),
    getJson<{ hello: AdminMailbox; support: AdminMailbox }>(
      '/api/admin/stats/mail',
    ),
  ]);
  return {
    chatLast24h: chat.status === 'fulfilled' ? chat.value.last24h : null,
    chatSeries: series.status === 'fulfilled' ? series.value.series : [],
    mail: mail.status === 'fulfilled' ? mail.value : null,
  };
}
