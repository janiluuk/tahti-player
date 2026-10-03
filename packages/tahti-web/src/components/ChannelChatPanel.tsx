import { useEffect, useRef, useState } from 'react';

import { Button, EmptyState, Input } from '@tahti-player/ui';

import {
  fetchChatAccess,
  fetchChatHistory,
  requestChatToken,
  requestChatViewerToken,
} from '../api/client';
import type { ChatMessage } from '../api/types';
import { centrifugoWsUrl } from '../lib/centrifugoWsUrl';
import {
  CHAT_OFF_MESSAGE,
  chatErrorFor,
  type ChatErrorAction,
} from '../lib/chatErrors';
import { useHcaptcha } from '../lib/useHcaptcha';
import { useAuthStore } from '../stores/authStore';
import { ChatAvatar } from './ChatAvatar';
import { ChatDailyListeners } from './ChatDailyListeners';
import { ChatListeningNow } from './ChatListeningNow';
import { ChatNotice } from './ChatNotice';
import { ChatReactionBar } from './ChatReactionBar';
import { FanChatRoom } from './FanChatRoom';

const HANDLE_KEY = 'tahti-web-chat-handle';
const forceMock = () => import.meta.env.VITE_FORCE_MOCK === '1';

// A dropped WebSocket is retried quietly in the background; the "Live"
// badge only disappears if the connection stays down past this grace
// window, so a brief network blip doesn't flicker the UI.
const DISCONNECT_GRACE_MS = 8000;
const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 5;

type LiveMode = 'live' | 'rest' | 'mock';

type Props = {
  slug: string;
  compact?: boolean;
  /** Fill the right sidebar height (no max-height cap). */
  rail?: boolean;
};

export function ChannelChatPanel({ slug, compact, rail }: Props) {
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [accessNote, setAccessNote] = useState<string | null>(null);
  const [chatOff, setChatOff] = useState(false);
  const [artistUsername, setArtistUsername] = useState<string | null>(null);
  const [canJoinFanChat, setCanJoinFanChat] = useState(false);
  const [inFanRoom, setInFanRoom] = useState(false);
  const [handle, setHandle] = useState('');
  const [pendingHandle, setPendingHandle] = useState('');
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorAction, setErrorAction] = useState<ChatErrorAction>(null);
  const [joining, setJoining] = useState(false);
  const [mode, setMode] = useState<LiveMode>('rest');
  const [wsStatus, setWsStatus] = useState<'off' | 'connecting' | 'connected'>(
    'off',
  );
  const [publishToken, setPublishToken] = useState<string | null>(null);
  const [supporter, setSupporter] = useState(false);
  const [channelRole, setChannelRole] = useState<'owner' | 'moderator' | null>(
    null,
  );
  const [countryCode, setCountryCode] = useState<string | null>(null);

  // Anonymous join needs hCaptcha when site key is set (signed-in skips captcha server-side).
  const captchaNeeded = !user && !forceMock();
  const {
    captchaRef,
    configured: captchaConfigured,
    getToken,
    reset: resetCaptcha,
  } = useHcaptcha(captchaNeeded);

  const wsRef = useRef<WebSocket | null>(null);
  const msgIdRef = useRef(1);
  const publishIdsRef = useRef(new Set<number>());
  const scrollRef = useRef<HTMLDivElement>(null);
  const badgesRef = useRef({
    supporter: false,
    channelRole: null as typeof channelRole,
    countryCode: null as string | null,
  });

  badgesRef.current = { supporter, channelRole, countryCode };

  // Reconnect bookkeeping. Refs, not state -- they drive retry timers and
  // must never trigger a re-render or an effect re-run on their own.
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const intentionalCloseRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Debounced view of "connected and live" -- only flips to false after
  // DISCONNECT_GRACE_MS of continuous disconnection, so a quick drop/retry
  // doesn't flash the Live badge off and on.
  const [liveDisplay, setLiveDisplay] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(HANDLE_KEY);
    if (saved) {
      setPendingHandle(saved);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([fetchChatHistory(slug), fetchChatAccess(slug)]).then(
      ([hist, access]) => {
        if (cancelled) {
          return;
        }
        setMessages(hist.data);
        // Only force mock send mode for offline demo — API-down fallback
        // must not block Centrifugo when a real token is available.
        if (forceMock()) {
          setMode('mock');
        } else {
          setMode('rest');
        }
        setCanJoinFanChat(access.data.canJoinFanChat);
        // Older APIs omit chatEnabled; only an explicit false hides the join form.
        setChatOff(access.data.chatEnabled === false);
        setArtistUsername(access.data.artistUsername || null);
        if (access.data.subscribersOnly && !access.data.canPostInChat) {
          setAccessNote(
            'Only fan subscribers can post here. You can still read along.',
          );
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    reconnectAttemptsRef.current = 0;
    void requestChatViewerToken(slug).then((token) => {
      if (cancelled || !token || modeRef.current === 'mock') {
        return;
      }
      connectWs(token, false);
    });
    return () => {
      cancelled = true;
      intentionalCloseRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
    // Reconnects on slug change only -- `mode` flipping (e.g. a dropped
    // socket demoting 'live' back to 'rest') must not re-run this and
    // spawn a second, redundant connection; connectWs's own onclose
    // handler owns retrying the existing one.
  }, [slug]);

  // Debounces the visible "Live" state: a brief drop-and-reconnect (the
  // common case) never touches the badge; only a sustained outage does.
  // No cleanup tied to [mode, wsStatus] here on purpose -- intermediate
  // status wiggles while disconnected (off -> connecting -> off, as
  // reconnect attempts happen) must not reset an in-progress countdown,
  // only the true-unmount effect below is allowed to cancel the timer.
  useEffect(() => {
    const nowLive = mode === 'live' && wsStatus === 'connected';
    if (nowLive) {
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
      setLiveDisplay(true);
      return;
    }
    if (graceTimerRef.current) {
      return;
    }
    graceTimerRef.current = setTimeout(() => {
      graceTimerRef.current = null;
      setLiveDisplay(false);
    }, DISCONNECT_GRACE_MS);
  }, [mode, wsStatus]);

  useEffect(() => {
    return () => {
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, []);

  // Retries a dropped socket in the background instead of leaving chat
  // silently dead until the listener manually rejoins. `token` is the one
  // this specific connection was opened with, closed over per-call so a
  // publisher's retry doesn't depend on state that may have moved on.
  function scheduleReconnect(token: string, canPublish: boolean) {
    if (intentionalCloseRef.current) {
      // We closed this ourselves (slug change / unmount) -- not a drop.
      intentionalCloseRef.current = false;
      return;
    }
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      return;
    }
    reconnectAttemptsRef.current += 1;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      if (canPublish) {
        connectWs(token, true);
      } else {
        void requestChatViewerToken(slug).then((freshToken) => {
          if (freshToken) {
            connectWs(freshToken, false);
          }
        });
      }
    }, RECONNECT_DELAY_MS * reconnectAttemptsRef.current);
  }

  function showError(message: string | null, action: ChatErrorAction = null) {
    setError(message);
    setErrorAction(action);
  }

  function showChatError(err: unknown, fallback?: string) {
    const { message, action } = chatErrorFor(err, fallback);
    if (action === 'chat_off') {
      setChatOff(true);
      showError(null);
      return;
    }
    if (action === 'captcha') {
      // Only the join form can collect a fresh captcha solve; pendingHandle
      // still holds the joined handle, so the form comes back prefilled.
      setHandle('');
      setPublishToken(null);
    }
    showError(message, action);
  }

  function connectWs(token: string, canPublish: boolean) {
    const url = centrifugoWsUrl();
    if (!url) {
      return;
    }
    try {
      wsRef.current?.close();
      const ws = new WebSocket(url);
      wsRef.current = ws;
      setWsStatus('connecting');
      ws.onopen = () => {
        ws.send(JSON.stringify({ id: msgIdRef.current++, connect: { token } }));
      };
      ws.onmessage = (ev) => {
        for (const line of String(ev.data).split('\n')) {
          if (!line.trim()) {
            continue;
          }
          try {
            const data = JSON.parse(line) as {
              id?: number;
              error?: { code?: number; message?: string };
              connect?: { client: string };
              push?: {
                pub?: {
                  data: {
                    handle?: string;
                    text?: string;
                    ts?: number;
                    supporter?: boolean;
                    channelRole?: 'owner' | 'moderator' | null;
                    countryCode?: string | null;
                    system?: boolean;
                  };
                };
              };
            };
            if (data.id != null && publishIdsRef.current.delete(data.id)) {
              if (data.error) {
                showChatError(
                  data.error.message,
                  'Your message was not sent. Try again in a moment.',
                );
              }
              continue;
            }
            if (data.connect) {
              ws.send(
                JSON.stringify({
                  id: msgIdRef.current++,
                  subscribe: { channel: `channel:${slug}` },
                }),
              );
              reconnectAttemptsRef.current = 0;
              setWsStatus('connected');
              if (canPublish) {
                setMode('live');
              }
            }
            if (data.push?.pub?.data?.text) {
              const msg = data.push.pub.data;
              setMessages((prev) =>
                [
                  ...prev,
                  {
                    id: `${Date.now()}-${Math.random()}`,
                    handle: msg.handle ?? 'anon',
                    text: msg.text!,
                    ts: msg.ts ?? Date.now(),
                    supporter: msg.supporter,
                    channelRole: msg.channelRole ?? null,
                    countryCode: msg.countryCode ?? null,
                    system: msg.system,
                  },
                ].slice(-100),
              );
            }
          } catch {
            // ignore malformed
          }
        }
      };
      ws.onerror = () => {
        setWsStatus('off');
        if (!canPublish) {
          setMode((m) => (m === 'live' ? 'rest' : m));
        }
      };
      ws.onclose = () => {
        setWsStatus('off');
        if (canPublish) {
          setMode((m) => (m === 'live' ? 'rest' : m));
        }
        scheduleReconnect(token, canPublish);
      };
    } catch {
      setWsStatus('off');
    }
  }

  async function join() {
    const h = pendingHandle.trim().slice(0, 32);
    if (!h) {
      showError('Pick a handle to join.');
      return;
    }
    const hcaptchaToken =
      captchaNeeded && captchaConfigured ? getToken() : undefined;
    if (captchaNeeded && captchaConfigured && !hcaptchaToken) {
      showError('Complete hCaptcha before joining.', 'captcha');
      return;
    }
    setJoining(true);
    showError(null);
    try {
      const { data, meta: joinMeta } = await requestChatToken(
        slug,
        h,
        hcaptchaToken,
      );
      localStorage.setItem(HANDLE_KEY, data.handle);
      setHandle(data.handle);
      setPublishToken(data.token);
      setSupporter(Boolean(data.supporter));
      setChannelRole(data.channelRole ?? null);
      setCountryCode(data.countryCode ?? null);
      resetCaptcha();
      if (joinMeta.source === 'mock') {
        setMode('mock');
      } else if (data.token && data.token !== 'mock-token') {
        connectWs(data.token, true);
        setMode('rest');
      } else {
        setMode('mock');
      }
    } catch (err) {
      // Fail closed: a real join failure (captcha / API down) must not
      // quietly hand out a working-looking compose box that only echoes
      // locally — that reads as sent but nobody else ever sees it. Stay on
      // the join form and let the user retry once the real thing works.
      resetCaptcha();
      showChatError(err, 'Could not join chat. Try again in a moment.');
    } finally {
      setJoining(false);
    }
  }

  function send() {
    const text = input.trim().slice(0, 500);
    if (!handle || !text) {
      return;
    }

    if (
      mode === 'live' &&
      publishToken &&
      wsRef.current &&
      wsStatus === 'connected'
    ) {
      const badges = badgesRef.current;
      const publishId = msgIdRef.current++;
      publishIdsRef.current.add(publishId);
      wsRef.current.send(
        JSON.stringify({
          id: publishId,
          publish: {
            channel: `channel:${slug}`,
            data: {
              handle,
              text,
              ts: Date.now(),
              supporter: badges.supporter || undefined,
              channelRole: badges.channelRole || undefined,
              countryCode: badges.countryCode || undefined,
            },
          },
        }),
      );
      setInput('');
      return;
    }

    // Fail closed: outside the deliberate FORCE_MOCK demo, a message that
    // can't actually reach the live channel must not be echoed locally as
    // if it had — that looks sent but nobody else ever sees it.
    if (mode !== 'mock') {
      showError('Not connected - message not sent. Try again in a moment.');
      return;
    }

    setMessages((prev) =>
      [
        ...prev,
        {
          id: `local-${Date.now()}`,
          handle,
          text,
          ts: Date.now(),
          system: false,
        },
      ].slice(-100),
    );
    setInput('');
  }

  if (inFanRoom) {
    return (
      <FanChatRoom
        slug={slug}
        rail={rail}
        onLeave={() => setInFanRoom(false)}
      />
    );
  }

  return (
    <div
      className={`border-border bg-background flex flex-col rounded-lg border ${
        rail ? 'h-full min-h-0 flex-1' : compact ? 'max-h-80' : 'max-h-[28rem]'
      }`}
    >
      <div className="border-border flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="font-display text-sm font-bold">Chat</div>
          <ChatDailyListeners slug={slug} />
          {canJoinFanChat && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setInFanRoom(true)}
            >
              Fan room
            </Button>
          )}
        </div>
        {liveDisplay && (
          <div className="text-foreground-secondary flex items-center gap-1.5 font-mono text-[10px] tracking-wide uppercase">
            <span
              className="bg-accent-green size-1.5 rounded-full"
              aria-hidden
            />
            Live
            <ChatListeningNow slug={slug} />
          </div>
        )}
      </div>

      <ChatReactionBar slug={slug} onError={(m) => showError(m)} />

      {error ? (
        <ChatNotice
          message={error}
          action={errorAction}
          artistUsername={artistUsername}
        />
      ) : (
        accessNote &&
        !chatOff && (
          <ChatNotice
            message={accessNote}
            action="subscribe"
            artistUsername={artistUsername}
          />
        )
      )}

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Chat messages"
        className={`space-y-2 overflow-y-auto px-3 py-2 text-sm ${rail ? 'min-h-0 flex-1' : 'flex-1'}`}
      >
        {messages.length === 0 && (
          <EmptyState
            size="sm"
            title="No messages yet"
            description="Say hi to start the chat."
          />
        )}
        {messages.map((m) => (
          <div key={m.id} className="flex items-start gap-1.5 leading-snug">
            <ChatAvatar handle={m.handle} />
            <p className="min-w-0">
              <span
                className={
                  m.channelRole === 'owner'
                    ? 'text-primary font-semibold'
                    : m.supporter
                      ? 'text-foreground font-semibold'
                      : 'text-foreground-secondary font-medium'
                }
              >
                {m.handle}
              </span>
              <span className="text-foreground"> {m.text}</span>
            </p>
          </div>
        ))}
      </div>

      {chatOff ? (
        <p
          role="status"
          className="border-border text-foreground-secondary border-t p-3 text-sm"
        >
          {CHAT_OFF_MESSAGE}
        </p>
      ) : !handle ? (
        <div className="border-border flex flex-col gap-2 border-t p-3">
          <Input
            label="Handle"
            value={pendingHandle}
            onChange={(e) => setPendingHandle(e.target.value)}
            placeholder="anonymous nick"
            size="sm"
          />
          {captchaNeeded && captchaConfigured && (
            <div ref={captchaRef} className="min-h-[78px]" />
          )}
          {user && (
            <p className="text-foreground-secondary text-[10px]">
              Signed in as @{user.username} - captcha not required.
            </p>
          )}
          <Button size="sm" disabled={joining} onClick={() => void join()}>
            {joining ? 'Joining…' : 'Join chat'}
          </Button>
        </div>
      ) : (
        <div className="border-border flex gap-2 border-t p-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'mock' || (mode === 'live' && wsStatus === 'connected')
                ? `Message as ${handle}`
                : 'Connecting…'
            }
            size="sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button
            size="sm"
            onClick={send}
            disabled={
              !input.trim() ||
              !(
                mode === 'mock' ||
                (mode === 'live' && wsStatus === 'connected')
              )
            }
          >
            Send
          </Button>
        </div>
      )}
    </div>
  );
}
