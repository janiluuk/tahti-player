import { useEffect, useState } from 'react';

import { Badge } from '@tahti-player/ui';

import {
  fetchMySupportTickets,
  type MySupportTicket,
  type SupportTicketStatus,
} from '../api/support';

const STATUS_BADGES: Record<
  SupportTicketStatus,
  { label: string; color: 'orange' | 'cyan' | 'green' }
> = {
  OPEN: { label: 'Open', color: 'orange' },
  IN_PROGRESS: { label: 'In progress', color: 'cyan' },
  RESOLVED: { label: 'Resolved', color: 'green' },
};

type MySupportTicketsProps = {
  /** Bump to refetch, e.g. after the contact form files a new request. */
  refreshKey?: number;
};

export function MySupportTickets({ refreshKey = 0 }: MySupportTicketsProps) {
  const [tickets, setTickets] = useState<MySupportTicket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchMySupportTickets().then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setTickets(result.tickets);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <section
      aria-labelledby="my-support-tickets-title"
      className="border-border flex flex-col gap-2 rounded-lg border p-4"
    >
      <h2
        id="my-support-tickets-title"
        className="font-display text-lg font-bold"
      >
        Your requests
      </h2>
      {error ? (
        <p className="text-accent-red-strong text-sm" role="alert">
          {error}
        </p>
      ) : tickets === null ? (
        <p className="text-foreground-secondary text-sm">Loading…</p>
      ) : tickets.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          You haven't contacted support while signed in yet. Requests you send
          below, and our replies, appear here.
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {tickets.map((ticket) => {
            const status = STATUS_BADGES[ticket.status];
            return (
              <li key={ticket.id} className="flex flex-col gap-2 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 font-medium">{ticket.subject}</span>
                  <Badge variant="pill" color={status.color}>
                    {status.label}
                  </Badge>
                </div>
                <time
                  dateTime={ticket.createdAt}
                  className="text-foreground-secondary text-xs"
                >
                  Sent {new Date(ticket.createdAt).toLocaleDateString()}
                </time>
                <p className="text-foreground-secondary whitespace-pre-wrap">
                  {ticket.message}
                </p>
                {ticket.replies.length === 0 ? (
                  <p className="text-foreground-secondary text-xs">
                    No reply yet.
                  </p>
                ) : (
                  <ul
                    aria-label={`Replies to ${ticket.subject}`}
                    className="flex flex-col gap-2"
                  >
                    {ticket.replies.map((reply) => (
                      <li
                        key={reply.id}
                        className="bg-primary/10 rounded-lg px-3 py-2"
                      >
                        <div className="text-foreground-secondary text-xs">
                          {reply.authorName} ·{' '}
                          <time dateTime={reply.createdAt}>
                            {new Date(reply.createdAt).toLocaleString()}
                          </time>
                        </div>
                        <p className="whitespace-pre-wrap">{reply.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
