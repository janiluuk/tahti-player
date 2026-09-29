import { useEffect, useRef, useState } from 'react';

import { Button, EmptyState, Input } from '@tahti-player/ui';

import {
  fetchChatAccess,
  fetchChatHistory,
  requestChatToken,
  requestChatViewerToken,
} from '../api/client';
import { postChatReaction } from '../api/studio-extras';
import type { ChatMessage } from '../api/types';
import { useHcaptcha } from '../lib/useHcaptcha';
import { useAuthStore } from '../stores/authStore';
import { ChatDailyListeners } from './ChatDailyListeners';
import { Eyebrow } from './tahti/Eyebrow';

// Must match the backend's CHAT_REACTION_EMOJIS whitelist exactly
// (packages/shared/src/dto/chat.ts in the main tahti repo) -- anything
// outside this set gets rejected server-side with "Invalid emoji".
const REACTION_EMOJIS = ['💜', '🔥', '🎶', '🎵', '🌟', '👏', '✨'] as const;
const REACTION_EMOJI_LABELS: Record<(typeof REACTION_EMOJIS)[number], string> =
  {
    '💜': 'purple heart',
    '🔥': 'fire',
    '🎶': 'musical notes',
    '🎵': 'musical note',
    '🌟': 'glowing star',
    '👏': 'clapping hands',
    '✨': 'sparkles',
  };

const HANDLE_KEY = 'tahti-web-chat-handle';
const forceMock = () => import.meta.env.VITE_FORCE_MOCK === '1';

// A dropped WebSocket is retried quietly in the background; the "Live"
// badge only disappears if the connection stays down past this grace
// window, so a brief network blip doesn't flicker the UI.
const DISCONNECT_GRACE_MS = 8000;
const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 5;

// Chat is anonymous/handle-based -- there's no avatarUrl to show, so each
// handle gets a deterministic initial-letter avatar instead. Cycling through
// theme accent tokens (not arbitrary hex) keeps it consistent with the rest
// of the app's palette.
const AVATAR_COLORS = [
  'var(--accent-red)',
  'var(--accent-green)',
  'var(--accent-blue)',
  'var(--accent-purple)',
  'var(--accent-cyan)',
  'var(--accent-yellow)',
  'var(--accent-orange)',
  'var(--primary)',
] as const;

function avatarColorFor(handle: string): string {
  let hash = 0;
  for (let i = 0; i < handle.length; i++) {
    hash = (hash * 31 + handle.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!;
}

function ChatAvatar({ handle }: { handle: string }) {
  return (
    <span
      className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-black/80"
      style={{ background: avatarColorFor(handle) }}
      aria-hidden
    >
      {handle.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

type LiveMode = 'live' | 'rest' | 'mock';

function centrifugoWsUrl(): string | null {
  const fromEnv = import.meta.env.VITE_CENTRIFUGO_WS;
  if (fromEnv) {
    return fromEnv;
  }
  // Dev: local Centrifugo. Prod/beta builds: public chat host.
  if (import.meta.env.DEV) {
    return 'ws://localhost:8000/connection/websocket';
  }
  return 'wss://chat.tahti.live/connection/websocket';
}

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
  const [handle, setHandle] = useState('');
  const [pendingHandle, setPendingHandle] = useState('');
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
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
  const [floatingReact, setFloatingReact] = useState<
    (typeof REACTION_EMOJIS)[number] | null
  >(null);
  const [reactBusy, setReactBusy] = useState(false);

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
        if (access.data.subscribersOnly && !access.data.canPostInChat) {
          setAccessNote(
            'Subscribers-only chat — you can read; posting needs a fan sub + login.',
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
      setError('Pick a handle to join.');
      return;
    }
    const hcaptchaToken =
      captchaNeeded && captchaConfigured ? getToken() : undefined;
    if (captchaNeeded && captchaConfigured && !hcaptchaToken) {
      setError('Complete hCaptcha before joining.');
      return;
    }
    setJoining(true);
    setError(null);
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
      setError(
        err instanceof Error
          ? `${err.message} — try again in a moment.`
          : 'Could not join live chat — try again in a moment.',
      );
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
      wsRef.current.send(
        JSON.stringify({
          id: msgIdRef.current++,
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
      setError('Not connected — message not sent. Try again in a moment.');
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
        </div>
        {liveDisplay && (
          <div className="text-foreground-secondary flex items-center gap-1.5 font-mono text-[10px] tracking-wide uppercase">
            <span
              className="bg-accent-green size-1.5 rounded-full"
              aria-hidden
            />
            Live
          </div>
        )}
      </div>

      <div className="border-border flex flex-wrap items-center gap-1 border-b px-3 py-2">
        <Eyebrow className="mr-1">React</Eyebrow>
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            disabled={reactBusy}
            aria-label={`React with ${REACTION_EMOJI_LABELS[emoji]}`}
            className="hover:bg-background-secondary rounded px-1.5 py-0.5 text-sm"
            onClick={() => {
              setReactBusy(true);
              void postChatReaction(slug, emoji).then((r) => {
                setReactBusy(false);
                if (r.ok) {
                  setFloatingReact(emoji);
                  window.setTimeout(() => setFloatingReact(null), 1200);
                } else {
                  setError(r.error);
                }
              });
            }}
          >
            {emoji}
          </button>
        ))}
        {floatingReact && (
          <span className="text-foreground-secondary text-xs" role="status">
            Sent {floatingReact}
            <span className="sr-only">
              {' '}
              ({REACTION_EMOJI_LABELS[floatingReact]})
            </span>
          </span>
        )}
      </div>

      {(error || accessNote) && (
        <div className="text-foreground-secondary border-border border-b px-3 py-2 text-xs">
          {error ?? accessNote}
        </div>
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

      {!handle ? (
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
              Signed in as @{user.username} — captcha not required.
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
