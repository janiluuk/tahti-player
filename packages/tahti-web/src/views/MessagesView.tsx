import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import { Button, Input, ViewShell } from '@tahti-player/ui';

import { fetchBlockedUsers } from '../api/blocks';
import {
  fetchConversation,
  fetchConversations,
  fetchOlderMessages,
  RECIPIENT_UNAVAILABLE_MESSAGE,
  searchUsers,
  sendDm,
  startConversation,
  type ChatDm,
  type ConversationSummary,
} from '../api/messages';
import { DmBlockButton } from '../components/DmBlockButton';
import { DmRoleBadge } from '../components/DmRoleBadge';
import { DmThreadMessages } from '../components/DmThreadMessages';
import { MessageContacts } from '../components/MessageContacts';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';

export function MessagesView({ threadId }: { threadId?: string } = {}) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [inbox, setInbox] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(threadId ?? null);
  const [messages, setMessages] = useState<ChatDm[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [other, setOther] = useState<ConversationSummary['otherUser'] | null>(
    null,
  );
  const [body, setBody] = useState('');
  const [composeUser, setComposeUser] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [blockedUsernames, setBlockedUsernames] = useState<Set<string>>(
    () => new Set(),
  );

  const reloadInbox = () => {
    void fetchConversations().then((r) => {
      setInbox(r.data);
    });
  };

  useEffect(() => {
    if (!user) {
      return;
    }
    reloadInbox();
    void fetchBlockedUsers().then((blocked) =>
      setBlockedUsernames(new Set(blocked.map((b) => b.username))),
    );
  }, [user]);

  const setBlocked = (username: string, blocked: boolean) => {
    setBlockedUsernames((current) => {
      const next = new Set(current);
      if (blocked) {
        next.add(username);
      } else {
        next.delete(username);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!user || !threadId) {
      return;
    }
    setActiveId(threadId);
    loadThread(threadId);
  }, [user, threadId]);

  function loadThread(id: string) {
    void fetchConversation(id).then((r) => {
      if (!r.data) {
        return;
      }
      setMessages(r.data.messages);
      setHasMore(r.data.hasMore === true);
      setOther(r.data.otherUser);
    });
  }

  const threadRef = useRef<HTMLDivElement>(null);

  const openThread = (id: string) => {
    setActiveId(id);
    loadThread(id);
    requestAnimationFrame(() => {
      threadRef.current?.scrollIntoView?.({ block: 'nearest' });
    });
    void navigate({ to: '/messages/$id', params: { id } });
  };

  const loadOlder = () => {
    const id = activeId;
    const oldest = messages[0];
    if (!id || !oldest || loadingOlder) {
      return;
    }
    setLoadingOlder(true);
    void fetchOlderMessages(id, oldest.id).then((page) => {
      setLoadingOlder(false);
      if (!page) {
        return;
      }
      const shown = new Set(messages.map((m) => m.id));
      setMessages((current) => [
        ...page.messages.filter((m) => !shown.has(m.id)),
        ...current,
      ]);
      setHasMore(page.hasMore);
    });
  };

  const markUnavailable = (id: string) => {
    setOther((o) => (o ? { ...o, available: false } : o));
    setInbox((list) =>
      list.map((c) =>
        c.id === id
          ? { ...c, otherUser: { ...c.otherUser, available: false } }
          : c,
      ),
    );
  };

  const send = () => {
    const text = body.trim();
    const id = activeId;
    if (!text || !id) {
      return;
    }
    void sendDm(id, text).then((r) => {
      if (r.ok) {
        setBody('');
        openThread(id);
        reloadInbox();
      } else if (r.recipientUnavailable) {
        markUnavailable(id);
      } else {
        setMsg(r.error);
      }
    });
  };

  const start = (username: string) => {
    setStarting(true);
    setMsg(null);
    void startConversation(username).then((r) => {
      setStarting(false);
      if (!r.ok) {
        setMsg(r.error);
      } else {
        setComposeUser('');
        reloadInbox();
        openThread(r.conversationId);
      }
    });
  };

  if (!user) {
    return (
      <ViewShell
        title="Messages"
        classes={{ root: 'px-0 pt-0 mx-auto max-w-4xl' }}
      >
        <p className="text-foreground-secondary text-sm">
          Sign in to read DMs.
        </p>
        <Button
          size="sm"
          onClick={() => useAuthModalStore.getState().open('login')}
        >
          Log in
        </Button>
      </ViewShell>
    );
  }

  return (
    <ViewShell
      title="Messages"
      classes={{ root: 'px-0 pt-0 mx-auto max-w-4xl' }}
    >
      <div className="flex flex-col gap-4">
        <form
          className="border-border flex flex-wrap items-end gap-2 rounded-lg border p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (composeUser.trim() && !starting) {
              start(composeUser.trim());
            }
          }}
        >
          <div className="min-w-36 flex-1">
            <Input
              label="Message @"
              value={composeUser}
              onChange={(e) => setComposeUser(e.target.value)}
              placeholder="username"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={starting || !composeUser.trim()}
          >
            Start
          </Button>
          <Button
            type="button"
            size="sm"
            variant="text"
            disabled={!composeUser.trim()}
            onClick={() => {
              const query = composeUser.trim();
              void searchUsers(query).then((r) => {
                if (r.data[0]) {
                  setMsg(null);
                  setComposeUser(r.data[0].username);
                } else {
                  setMsg(`No account found for "${query}".`);
                }
              });
            }}
          >
            Search
          </Button>
        </form>

        <MessageContacts onPick={start} disabled={starting} />

        {msg && (
          <p className="text-sm" role="status">
            {msg}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-[240px_1fr]">
          <ul className="border-border divide-border max-h-96 divide-y overflow-y-auto rounded-lg border">
            {inbox.length === 0 ? (
              <li className="text-foreground-secondary p-3 text-sm">
                No conversations.
              </li>
            ) : (
              inbox.map((c) => (
                <li key={c.id}>
                  <Button
                    variant="text"
                    size="flexible"
                    onClick={() => openThread(c.id)}
                    aria-current={activeId === c.id ? 'page' : undefined}
                    className={`w-full flex-col items-stretch rounded-none border-l-2 px-3 py-2 text-left text-sm whitespace-normal active:scale-100 ${
                      activeId === c.id
                        ? 'border-accent-purple bg-accent-purple/20 text-foreground'
                        : 'hover:bg-background-secondary border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="truncate">
                        {c.otherUser.displayName}
                      </span>
                      <DmRoleBadge role={c.otherUser.channelRole} />
                    </div>
                    <div className="text-foreground-secondary truncate text-xs">
                      {c.lastMessage?.body ?? 'No messages yet'}
                    </div>
                  </Button>
                </li>
              ))
            )}
          </ul>

          <div
            ref={threadRef}
            data-testid="dm-thread"
            className={`border-border min-h-72 flex-col rounded-lg border ${
              activeId ? 'flex' : 'hidden md:flex'
            }`}
          >
            {!activeId ? (
              <p className="text-foreground-secondary p-4 text-sm">
                Select a conversation.
              </p>
            ) : (
              <>
                <div className="border-border flex items-center gap-1.5 border-b px-3 py-2 text-sm font-medium">
                  <span className="min-w-0 truncate">{other?.displayName}</span>
                  <DmRoleBadge role={other?.channelRole} />
                  {other && other.available !== false ? (
                    <span className="ml-auto">
                      <DmBlockButton
                        username={other.username}
                        displayName={other.displayName}
                        blocked={blockedUsernames.has(other.username)}
                        onChange={(blocked) =>
                          setBlocked(other.username, blocked)
                        }
                      />
                    </span>
                  ) : null}
                </div>
                <DmThreadMessages
                  messages={messages}
                  hasMore={hasMore}
                  loadingOlder={loadingOlder}
                  onLoadOlder={loadOlder}
                />
                {other && blockedUsernames.has(other.username) ? (
                  <p
                    role="status"
                    className="border-border text-foreground-secondary border-t p-3 text-sm"
                  >
                    You blocked this account. Unblock it to message each other
                    again.
                  </p>
                ) : other?.available === false ? (
                  <p
                    role="status"
                    className="border-border text-foreground-secondary border-t p-3 text-sm"
                  >
                    {RECIPIENT_UNAVAILABLE_MESSAGE}
                  </p>
                ) : (
                  <div className="border-border flex gap-2 border-t p-3">
                    <Input
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Write a message…"
                      size="sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          send();
                        }
                      }}
                    />
                    <Button size="sm" disabled={!body.trim()} onClick={send}>
                      Send
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ViewShell>
  );
}
