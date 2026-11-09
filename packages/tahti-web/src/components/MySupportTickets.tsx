import { LifeBuoyIcon } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button, InlineLoader, Textarea } from '@tahti-player/ui';

import {
  closeSupportTicket,
  fetchMySupportTickets,
  replyToSupportTicket,
  type MySupportTicket,
  type MySupportTicketReply,
  type SupportTicketStatus,
} from '../api/support';
import { dateLocaleTag } from '../lib/locale';
import { ListingDate } from './ListingDate';
import { PageEmpty, PageError } from './PageStates';

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
  const { t } = useTranslation('web');
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
        submitOnModEnter
        aria-label={t('mySupportTicketsLabels.replyToSubject', {
          subject: ticket.subject,
        })}
        placeholder={
          ticket.status === 'RESOLVED'
            ? t('mySupportTicketsStates.stillNeedHelpReplyingReopens')
            : t('mySupportTicketsStates.addAReply')
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
        {sending
          ? t('mySupportTicketsStates.sending')
          : t('mySupportTicketsStates.sendReply')}
      </Button>
    </form>
  );
}

type MySupportTicketsProps = {
  /** Bump to refetch, e.g. after the contact form files a new request. */
  refreshKey?: number;
  onNewRequest?: () => void;
};

export function MySupportTickets({
  refreshKey = 0,
  onNewRequest,
}: MySupportTicketsProps) {
  const { t } = useTranslation('web');
  const [tickets, setTickets] = useState<MySupportTicket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

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
  }, [refreshKey, attempt]);

  const [closeError, setCloseError] = useState<{
    ticketId: string;
    message: string;
  } | null>(null);
  const [closing, setClosing] = useState<string | null>(null);

  const closeTicket = async (ticketId: string) => {
    setClosing(ticketId);
    setCloseError(null);
    const result = await closeSupportTicket(ticketId);
    setClosing(null);
    if (!result.ok) {
      setCloseError({ ticketId, message: result.error });
      return;
    }
    setTickets((current) =>
      (current ?? []).map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: 'RESOLVED' } : ticket,
      ),
    );
  };

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
        {t('supportTickets.yourRequests')}
      </h2>
      {error ? (
        <PageError
          title={t('supportTickets.loadError')}
          description={error}
          onRetry={() => {
            setError(null);
            setAttempt((n) => n + 1);
          }}
        />
      ) : tickets === null ? (
        <InlineLoader label={t('supportTickets.loading')} />
      ) : tickets.length === 0 ? (
        <PageEmpty
          title={t('supportTickets.emptyTitle')}
          description={t('supportTickets.emptyDescription')}
          action={
            onNewRequest ? (
              <Button size="sm" variant="secondary" onClick={onNewRequest}>
                <LifeBuoyIcon size={16} aria-hidden />
                {t('emptyActions.newSupportRequest')}
              </Button>
            ) : undefined
          }
        />
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
                <span className="text-foreground-secondary flex items-center gap-1 text-xs">
                  {t('supportTickets.sent')}{' '}
                  <ListingDate value={ticket.createdAt} />
                </span>
                <p className="text-foreground-secondary whitespace-pre-wrap">
                  {ticket.message}
                </p>
                {ticket.replies.length === 0 ? (
                  <PageEmpty title={t('supportTickets.noReply')} />
                ) : (
                  <ul
                    aria-label={t('mySupportTicketsLabels.repliesToSubject', {
                      subject: ticket.subject,
                    })}
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
                            {new Date(reply.createdAt).toLocaleString(
                              dateLocaleTag(),
                            )}
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
                {ticket.status !== 'RESOLVED' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="text"
                      aria-label={`${t('supportTickets.markResolved')}: ${ticket.subject}`}
                      disabled={closing === ticket.id}
                      onClick={() => void closeTicket(ticket.id)}
                    >
                      {t('supportTickets.markResolved')}
                    </Button>
                    {closeError?.ticketId === ticket.id ? (
                      <span
                        role="alert"
                        className="text-accent-red-strong text-xs"
                      >
                        {closeError.message}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
