import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Badge, Button, Textarea } from '@tahti-player/ui';

import {
  fetchMySupportTickets,
  replyToSupportTicket,
  type MySupportTicket,
  type MySupportTicketReply,
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

const MAX_REPLY_LENGTH = 5000;

/** Follow-up box under a request. Replying to a resolved request reopens it. */
function TicketReplyForm({
  ticket,
  onSent,
}: {
  ticket: MySupportTicket;
  onSent: (reply: MySupportTicketReply) => void;
}) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = body.trim();
    if (!text) {
      return;
    }
    setSending(true);
    const result = await replyToSupportTicket(ticket.id, text);
    setSending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setBody('');
    onSent(result.reply);
  };

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => void submit(event)}
    >
      <Textarea
        aria-label={`Reply to ${ticket.subject}`}
        placeholder={
          ticket.status === 'RESOLVED'
            ? 'Still need help? Replying reopens this request.'
            : 'Add a reply…'
        }
        rows={2}
        maxLength={MAX_REPLY_LENGTH}
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />
      <Button
        type="submit"
        size="sm"
        variant="secondary"
        className="self-end"
        disabled={sending || !body.trim()}
      >
        {sending ? 'Sending…' : 'Send reply'}
      </Button>
    </form>
  );
}

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

  const addReply = (ticketId: string, reply: MySupportTicketReply) => {
    setTickets((current) =>
      (current ?? []).map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              status: ticket.status === 'RESOLVED' ? 'OPEN' : ticket.status,
              replies: [...ticket.replies, reply],
            }
          : ticket,
      ),
    );
  };

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
                        className={
                          reply.fromRequester
                            ? 'border-border rounded-lg border px-3 py-2'
                            : 'bg-primary/10 rounded-lg px-3 py-2'
                        }
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
                <TicketReplyForm
                  ticket={ticket}
                  onSent={(reply) => addReply(ticket.id, reply)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
