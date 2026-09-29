import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Button, Input, ViewShell } from '@tahti-player/ui';

import {
  fetchConversation,
  fetchConversations,
  searchUsers,
  sendDm,
  startConversation,
  type ChatDm,
  type ConversationSummary,
} from '../api/messages';
import { MessageContacts } from '../components/MessageContacts';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';

export function MessagesView({ threadId }: { threadId?: string } = {}) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [inbox, setInbox] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(threadId ?? null);
  const [messages, setMessages] = useState<ChatDm[]>([]);
  const [otherName, setOtherName] = useState('');
  const [body, setBody] = useState('');
  const [composeUser, setComposeUser] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

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
  }, [user]);

  useEffect(() => {
    if (!user || !threadId) {
      return;
    }
    setActiveId(threadId);
    void fetchConversation(threadId).then((r) => {
      if (!r.data) {
        return;
      }
      setMessages(r.data.messages);
      setOtherName(r.data.otherUser.displayName);
    });
  }, [user, threadId]);

  const openThread = (id: string) => {
    setActiveId(id);
    void fetchConversation(id).then((r) => {
      if (!r.data) {
        return;
      }
      setMessages(r.data.messages);
      setOtherName(r.data.otherUser.displayName);
    });
    void navigate({ to: '/messages/$id', params: { id } });
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
      <div className="border-border flex flex-wrap gap-2 rounded-lg border p-3">
        <Input
          label="Message @"
          value={composeUser}
          onChange={(e) => setComposeUser(e.target.value)}
          placeholder="username"
        />
        <Button
          size="sm"
          disabled={starting || !composeUser.trim()}
          onClick={() => start(composeUser.trim())}
        >
          Start
        </Button>
        <Button
          size="sm"
          variant="text"
          onClick={() => {
            void searchUsers(composeUser.trim()).then((r) => {
              if (r.data[0]) {
                setComposeUser(r.data[0].username);
              }
            });
          }}
        >
          Search
        </Button>
      </div>

      <MessageContacts onPick={start} disabled={starting} />

      {msg && <p className="text-sm">{msg}</p>}

      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <ul className="border-border divide-border max-h-96 divide-y overflow-y-auto rounded-lg border">
          {inbox.length === 0 ? (
            <li className="text-foreground-secondary p-3 text-sm">
              No conversations.
            </li>
          ) : (
            inbox.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => openThread(c.id)}
                  aria-current={activeId === c.id ? 'page' : undefined}
                  className={`w-full border-l-2 px-3 py-2 text-left text-sm transition-colors ${
                    activeId === c.id
                      ? 'border-accent-purple bg-accent-purple/20 text-foreground'
                      : 'hover:bg-background-secondary border-transparent'
                  }`}
                >
                  <div className="font-medium">{c.otherUser.displayName}</div>
                  <div className="text-foreground-secondary truncate text-xs">
                    {c.lastMessage?.body ?? 'No messages yet'}
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="border-border flex min-h-72 flex-col rounded-lg border">
          {!activeId ? (
            <p className="text-foreground-secondary p-4 text-sm">
              Select a conversation.
            </p>
          ) : (
            <>
              <div className="border-border border-b px-3 py-2 text-sm font-medium">
                {otherName}
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-lg px-3 py-2 ${
                      m.isMine
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'border-accent-purple/30 bg-accent-purple/15'
                    }`}
                  >
                    <div className="text-[10px] opacity-70">
                      {m.senderDisplayName}
                    </div>
                    {m.body}
                  </div>
                ))}
              </div>
              <div className="border-border flex gap-2 border-t p-3">
                <Input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write a message…"
                  size="sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!body.trim() || !activeId) {
                        return;
                      }
                      void sendDm(activeId, body.trim()).then((r) => {
                        if (!r.ok) {
                          setMsg(r.error);
                        } else {
                          setBody('');
                          openThread(activeId);
                          reloadInbox();
                        }
                      });
                    }
                  }}
                />
                <Button
                  size="sm"
                  disabled={!body.trim()}
                  onClick={() => {
                    if (!activeId) {
                      return;
                    }
                    void sendDm(activeId, body.trim()).then((r) => {
                      if (!r.ok) {
                        setMsg(r.error);
                      } else {
                        setBody('');
                        openThread(activeId);
                        reloadInbox();
                      }
                    });
                  }}
                >
                  Send
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </ViewShell>
  );
}
