import { useEffect, useRef, useState } from 'react';

import { Button, Input } from '@nuclearplayer/ui';

import {
  fetchChatAccess,
  fetchChatHistory,
  requestChatToken,
  requestChatViewerToken,
  type FetchMeta,
} from '../api/client';
import { allowMockFallback } from '../api/mode';
import { postChatReaction } from '../api/studio-extras';
import type { ChatMessage } from '../api/types';
import { useHcaptcha } from '../lib/useHcaptcha';
import { useAuthStore } from '../stores/authStore';

const REACTION_EMOJIS = ['🔥', '❤️', '👏', '🙌', '😮'] as const;

const HANDLE_KEY = 'tahti-web-chat-handle';
const forceMock = () => import.meta.env.VITE_FORCE_MOCK === '1';

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
  const [meta, setMeta] = useState<FetchMeta | null>(null);
  const [accessNote, setAccessNote] = useState<string | null>(null);
  const [canPost, setCanPost] = useState(true);
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
  const [floatingReact, setFloatingReact] = useState<string | null>(null);
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

  useEffect(() => {
    const saved = localStorage.getItem(HANDLE_KEY);
    if (saved) {
      setPendingHandle(saved);
    } else if (user?.username) {
      setPendingHandle(user.username);
    }
  }, [user?.username]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([fetchChatHistory(slug), fetchChatAccess(slug)]).then(
      ([hist, access]) => {
        if (cancelled) {
          return;
        }
        setMessages(hist.data);
        setMeta(hist.meta);
        // Only force mock send mode for offline demo — API-down fallback
        // must not block Centrifugo when a real token is available.
        if (forceMock()) {
          setMode('mock');
        } else {
          setMode('rest');
        }
        setCanPost(access.data.canPostInChat !== false);
        if (access.data.subscribersOnly && !access.data.canPostInChat) {
          setAccessNote(
            'Subscribers-only chat — you can read; posting needs a fan sub + login.',
          );
        } else if (!access.data.canPostInChat) {
          setAccessNote('You can read this chat, but posting is not allowed.');
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
    void requestChatViewerToken(slug).then((token) => {
      if (cancelled || !token || mode === 'mock') {
        return;
      }
      connectWs(token, false);
    });
    return () => {
      cancelled = true;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [slug, mode]);

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
      resetCaptcha();
      if (allowMockFallback()) {
        // Dev / FORCE_MOCK: local send so demos still work offline
        localStorage.setItem(HANDLE_KEY, h);
        setHandle(h);
        setPublishToken('mock-local');
        setMode('mock');
        setError(
          err instanceof Error
            ? `${err.message} — using local mock send`
            : 'Join failed — using local mock send',
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Could not join chat. Complete captcha and try again.',
        );
      }
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

    // REST history has no client publish; mock/local append with status badge
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
    if (mode !== 'mock') {
      setMode('mock');
    }
  }

  const statusLabel =
    mode === 'live' && wsStatus === 'connected'
      ? 'Live (Centrifugo)'
      : mode === 'mock'
        ? 'Mock / local send'
        : 'REST history (send is local until WS connects)';

  return (
    <div
      className={`border-border bg-background flex flex-col rounded-lg border ${
        rail ? 'h-full min-h-0 flex-1' : compact ? 'max-h-80' : 'max-h-[28rem]'
      }`}
    >
      <div className="border-border flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="font-display text-sm font-bold">Chat</div>
        <div className="text-foreground-secondary text-[10px] tracking-wide uppercase">
          {statusLabel}
          {meta?.source ? `, ${meta.source}` : ''}
        </div>
      </div>

      <div className="border-border flex flex-wrap items-center gap-1 border-b px-3 py-2">
        <span className="text-foreground-secondary mr-1 text-[10px] uppercase">
          React
        </span>
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            disabled={reactBusy}
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
          <span className="text-foreground-secondary text-xs">
            Sent {floatingReact}
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
        className={`space-y-2 overflow-y-auto px-3 py-2 text-sm ${rail ? 'min-h-0 flex-1' : 'flex-1'}`}
      >
        {messages.length === 0 && (
          <p className="text-foreground-secondary text-xs">
            No messages yet — say hi.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="leading-snug">
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
          {captchaNeeded && !captchaConfigured && (
            <p className="text-foreground-secondary text-[10px]">
              Captcha skipped — set <code>VITE_HCAPTCHA_SITEKEY</code> for
              anonymous join against a live API. Mock / missing key still joins
              locally when the API rejects.
            </p>
          )}
          {forceMock() && (
            <p className="text-foreground-secondary text-[10px]">
              Captcha skipped in mock (<code>VITE_FORCE_MOCK=1</code>).
            </p>
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
      ) : !canPost ? (
        <div className="border-border text-foreground-secondary border-t px-3 py-3 text-xs">
          Joined as {handle} — read-only (posting locked for your access).
        </div>
      ) : (
        <div className="border-border flex gap-2 border-t p-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message as ${handle}`}
            size="sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button size="sm" onClick={send} disabled={!input.trim()}>
            Send
          </Button>
        </div>
      )}
    </div>
  );
}
