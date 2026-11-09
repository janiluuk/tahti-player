import {
  CheckIcon,
  CircleDotIcon,
  Clock3Icon,
  ListFilterIcon,
  ReplyIcon,
  SearchIcon,
  SendIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import { Badge, Button, Input } from '@tahti-player/ui';

import {
  fetchAdminSupportTicketDetail,
  fetchAdminSupportTickets,
  postAdminSupportTicketMessage,
  updateAdminSupportTicketStatus,
  type AdminSupportStatus,
  type AdminSupportTicket,
  type AdminSupportTicketDetail,
} from '../../../../api/admin';
import { ListingDate } from '../../../../components/ListingDate';
import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';
import { dateLocaleTag } from '../../../../lib/locale';
import { ModerationTabs } from '../ModerationTabs';

function statusBadge(status: AdminSupportStatus): {
  label: string;
  color: 'orange' | 'cyan' | 'green';
} {
  if (status === 'OPEN') {
    return { label: 'Open', color: 'orange' };
  }
  if (status === 'IN_PROGRESS') {
    return { label: 'In progress', color: 'cyan' };
  }
  return { label: 'Resolved', color: 'green' };
}

type SupportFilter = AdminSupportStatus | 'all' | 'awaiting';

function filters(t: TFunction<'web'>): { id: SupportFilter; label: string }[] {
  return [
    { id: 'all', label: 'All' },
    { id: 'awaiting', label: t('supportTabMore.needsReply') },
    { id: 'OPEN', label: t('supportTabMore.open') },
    { id: 'IN_PROGRESS', label: t('supportTabMore.inProgress') },
    { id: 'RESOLVED', label: t('supportTabMore.resolved') },
  ];
}

const FILTER_TAB_ICONS = {
  all: ListFilterIcon,
  awaiting: ReplyIcon,
  OPEN: CircleDotIcon,
  IN_PROGRESS: Clock3Icon,
  RESOLVED: CheckIcon,
};

function requesterLabel(t: {
  artistUsername: string | null;
  contactEmail: string | null;
}): string {
  return t.artistUsername ? `@${t.artistUsername}` : (t.contactEmail ?? '—');
}

/** Support tab — ticket list with search, a combined message/status-change
 * timeline per ticket, a reply composer, and an explicit Resolve action. See
 * AdminModerationView. Notes come pre-sorted oldest-first from the API
 * (tahti-org 02beac67); a board reply is `kind: 'MESSAGE'`, an automatic
 * transition record is `kind: 'STATUS_CHANGE'`. */
export function SupportTab() {
  const { t } = useTranslation('web');
  const [filter, setFilter] = useState<SupportFilter>('OPEN');
  const [query, setQuery] = useState('');
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminSupportTicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const applyTicketPatch = (
    updated: AdminSupportTicketDetail,
    answered = updated.status === 'RESOLVED',
  ) => {
    setDetail(updated);
    setTickets((current) =>
      current.map((row) =>
        row.id === updated.id
          ? {
              ...row,
              status: updated.status,
              awaitingReply: answered ? false : row.awaitingReply,
            }
          : row,
      ),
    );
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(
      () => {
        void fetchAdminSupportTickets({
          status:
            filter === 'all' || filter === 'awaiting' ? undefined : filter,
          awaitingReply: filter === 'awaiting',
          q: query.trim() || undefined,
        }).then((result) => {
          if (cancelled) {
            return;
          }
          setTickets(result.data);
          setLoadError(
            result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
          );
          setSelectedId((current) => {
            if (current && result.data.some((t) => t.id === current)) {
              return current;
            }
            return result.data[0]?.id ?? null;
          });
          setLoading(false);
        });
      },
      query ? 250 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [filter, query, attempt]);

  useEffect(() => {
    setMsg(null);
    setReply('');
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    void fetchAdminSupportTicketDetail(selectedId).then((result) => {
      if (cancelled) {
        return;
      }
      setDetail(result.data);
      setDetailLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const setStatus = (status: AdminSupportStatus) => {
    if (!detail || busy) {
      return;
    }
    setBusy(true);
    void updateAdminSupportTicketStatus(detail.id, status).then((r) => {
      setBusy(false);
      if (!r.ok) {
        setMsg(r.error);
        return;
      }
      applyTicketPatch(r.data);
    });
  };

  const sendReply = () => {
    const body = reply.trim();
    if (!detail || !body || busy) {
      return;
    }
    setBusy(true);
    void postAdminSupportTicketMessage(detail.id, body).then((r) => {
      setBusy(false);
      if (!r.ok) {
        setMsg(r.error);
        return;
      }
      applyTicketPatch(r.data, true);
      setReply('');
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="border-border bg-background-secondary/30 flex flex-col gap-3 rounded-lg border p-3 sm:p-4 xl:flex-row xl:items-end xl:justify-between">
        <ModerationTabs
          activeId={filter}
          items={filters(t).map((item) => ({
            ...item,
            icon: FILTER_TAB_ICONS[item.id],
          }))}
          ariaLabel="Support ticket status"
          onChange={(id) => setFilter(id as SupportFilter)}
          className="min-w-0 flex-1"
        />
        <div className="w-full shrink-0 xl:max-w-sm">
          <Input
            enterKeyHint="search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('supportTab.searchSubjectMessageRequester')}
            size="sm"
            aria-label={t('supportTab.searchSupportTickets')}
            endAddon={<SearchIcon size={16} aria-hidden />}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <StudioPanel className="max-h-[32rem] overflow-y-auto p-0 sm:p-0">
          {loading ? (
            <PageLoading label={t('loading.loadingSupportTickets')} />
          ) : loadError && tickets.length === 0 ? (
            <PageError
              title={t('loadErrors.couldNotLoadSupportTickets')}
              description={loadError}
              onRetry={() => setAttempt((n) => n + 1)}
            />
          ) : tickets.length === 0 ? (
            <PageEmpty
              title={t('empties.noTicketsInThisView')}
              action={
                query.trim() ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setQuery('')}
                  >
                    {t('supportTab.clearSearch')}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-border divide-y">
              {tickets.map((ticket) => {
                const badge = statusBadge(ticket.status);
                return (
                  <li key={ticket.id}>
                    <Button
                      variant="text"
                      size="flexible"
                      onClick={() => setSelectedId(ticket.id)}
                      className={`block w-full rounded-none px-3 py-2.5 text-left text-sm font-normal whitespace-normal active:scale-100 ${
                        selectedId === ticket.id
                          ? 'bg-background-secondary'
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className="line-clamp-2 min-w-0 font-medium break-words"
                          title={ticket.subject}
                        >
                          {ticket.subject}
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          {ticket.awaitingReply ? (
                            <Badge variant="pill" color="red">
                              {t('supportTab.needsReply')}
                            </Badge>
                          ) : null}
                          <Badge variant="pill" color={badge.color}>
                            {badge.label}
                          </Badge>
                        </span>
                      </div>
                      <div className="text-foreground-secondary truncate text-xs">
                        {requesterLabel(ticket)} · {ticket.category} ·{' '}
                        <ListingDate value={ticket.createdAt} />
                      </div>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </StudioPanel>

        <StudioPanel className="flex min-h-[24rem] min-w-0 flex-col p-0 sm:p-0">
          {!selectedId ? (
            <p className="text-foreground-secondary p-4 text-sm">
              {t('supportTab.selectATicket')}
            </p>
          ) : detailLoading || !detail ? (
            <PageLoading label={t('loading.loadingTicket')} />
          ) : (
            <>
              <div className="border-border flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
                <div className="min-w-0 flex-1 basis-56">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold">{detail.subject}</h2>
                    <Badge
                      variant="pill"
                      color={statusBadge(detail.status).color}
                    >
                      {statusBadge(detail.status).label}
                    </Badge>
                  </div>
                  <p className="text-foreground-secondary text-xs">
                    {requesterLabel(detail)} · {detail.category} ·{' '}
                    <ListingDate value={detail.createdAt} />
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {detail.status === 'OPEN' && (
                    <Button
                      className="gap-1.5"
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => setStatus('IN_PROGRESS')}
                    >
                      <CircleDotIcon size={14} aria-hidden />
                      {t('supportTab.startProgress')}
                    </Button>
                  )}
                  {detail.status !== 'RESOLVED' ? (
                    <Button
                      className="gap-1.5"
                      size="sm"
                      disabled={busy}
                      onClick={() => setStatus('RESOLVED')}
                    >
                      <CheckIcon size={14} aria-hidden />
                      {t('supportTab.resolve')}
                    </Button>
                  ) : (
                    <Button
                      className="gap-1.5"
                      size="sm"
                      variant="text"
                      disabled={busy}
                      onClick={() => setStatus('OPEN')}
                    >
                      <Clock3Icon size={14} aria-hidden />
                      {t('supportTab.reopen')}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
                <div className="bg-background-secondary rounded-lg px-3 py-2">
                  <div className="text-foreground-secondary text-[10px] tracking-wide uppercase">
                    {t('supportTab.originalRequest')}
                  </div>
                  {detail.message}
                </div>
                {detail.notes.map((n) =>
                  n.kind === 'STATUS_CHANGE' ? (
                    <p
                      key={n.id}
                      className="text-foreground-secondary py-1 text-center text-xs"
                    >
                      {n.body} ·{' '}
                      {new Date(n.createdAt).toLocaleString(dateLocaleTag())}
                    </p>
                  ) : (
                    <div
                      key={n.id}
                      className="bg-primary/10 max-w-[85%] rounded-lg px-3 py-2"
                    >
                      <div className="text-foreground-secondary text-[10px]">
                        {n.authorDisplayName ?? 'Board'} ·{' '}
                        {new Date(n.createdAt).toLocaleString(dateLocaleTag())}
                      </div>
                      {n.body}
                    </div>
                  ),
                )}
              </div>

              <div className="border-border flex flex-col gap-2 border-t p-3">
                {msg && <p className="text-xs">{msg}</p>}
                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    sendReply();
                  }}
                >
                  <Input
                    enterKeyHint="send"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={t('supportTab.writeAReply')}
                    size="sm"
                    className="flex-1"
                    aria-label={t('supportTab.replyToTicket')}
                  />
                  <Button
                    className="gap-1.5"
                    size="sm"
                    disabled={busy || !reply.trim()}
                    type="submit"
                  >
                    <SendIcon size={14} aria-hidden />
                    {t('supportTab.reply')}
                  </Button>
                </form>
              </div>
            </>
          )}
        </StudioPanel>
      </div>
    </div>
  );
}
