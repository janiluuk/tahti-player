import { ArrowLeftIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button, EmptyState, Input } from '@tahti-player/ui';

import { fetchFanChatHistory, requestFanChatToken } from '../api/fan-chat';
import { centrifugoWsUrl } from '../lib/centrifugoWsUrl';
import { chatErrorFor } from '../lib/chatErrors';
import { ChatAvatar } from './ChatAvatar';

type FanMessage = { id: string; handle: string; text: string };

const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 5;

export function FanChatRoom({
  slug,
  rail,
  onLeave,
}: {
  slug: string;
  rail?: boolean;
  onLeave: () => void;
}) {
  const [messages, setMessages] = useState<FanMessage[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const roomRef = useRef<{ channel: string; handle: string } | null>(null);
  const nextIdRef = useRef(1);
  const publishIdsRef = useRef(new Set<number>());

  useEffect(() => {
    let cancelled = false;
    void fetchFanChatHistory(slug).then((history) => {
      if (!cancelled && history.length > 0) {
        setMessages((live) => [
          ...history.map((m, i) => ({
            id: `history-${m.ts}-${i}`,
            handle: m.handle,
            text: m.text,
          })),
          ...live,
        ]);
      }
    });
    let attempts = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    // A fan token lasts an hour and the server closes the connection when it
    // runs out, so every (re)connect asks for a new one.
    function connect() {
      void requestFanChatToken(slug).then((result) => {
        const url = centrifugoWsUrl();
        if (cancelled) {
          return;
        }
        if (!result.ok) {
          setError(result.error);
          return;
        }
        if (!url) {
          return;
        }
        const { token, channel, handle } = result.data;
        roomRef.current = { channel, handle };
        const ws = new WebSocket(url);
        wsRef.current = ws;
        ws.onopen = () => {
          ws.send(
            JSON.stringify({ id: nextIdRef.current++, connect: { token } }),
          );
        };
        ws.onmessage = (ev) => {
          for (const line of String(ev.data).split('\n')) {
            if (!line.trim()) {
              continue;
            }
            try {
              const msg = JSON.parse(line) as {
                id?: number;
                error?: { message?: string };
                connect?: unknown;
                push?: {
                  channel?: string;
                  pub?: { data?: { handle?: string; text?: string } };
                };
              };
              if (msg.id != null && publishIdsRef.current.delete(msg.id)) {
                if (msg.error) {
                  setError(
                    chatErrorFor(
                      msg.error.message,
                      'Your message was not sent. Try again in a moment.',
                    ).message,
                  );
                }
                continue;
              }
              if (msg.connect) {
                ws.send(
                  JSON.stringify({
                    id: nextIdRef.current++,
                    subscribe: { channel },
                  }),
                );
                attempts = 0;
                setError(null);
                setConnected(true);
              }
              const data = msg.push?.pub?.data;
              if (msg.push?.channel === channel && data?.text) {
                setMessages((prev) =>
                  [
                    ...prev,
                    {
                      id: `${Date.now()}-${Math.random()}`,
                      handle: data.handle ?? 'fan',
                      text: data.text!,
                    },
                  ].slice(-100),
                );
              }
            } catch {
              continue;
            }
          }
        };
        ws.onclose = () => {
          setConnected(false);
          if (cancelled || attempts >= MAX_RECONNECT_ATTEMPTS) {
            return;
          }
          attempts += 1;
          retryTimer = setTimeout(connect, RECONNECT_DELAY_MS * attempts);
        };
      });
    }
    connect();
    return () => {
      cancelled = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [slug]);

  function send() {
    const text = input.trim().slice(0, 500);
    const room = roomRef.current;
    if (!text || !room || !wsRef.current || !connected) {
      return;
    }
    const publishId = nextIdRef.current++;
    publishIdsRef.current.add(publishId);
    setError(null);
    wsRef.current.send(
      JSON.stringify({
        id: publishId,
        publish: {
          channel: room.channel,
          data: { handle: room.handle, text, ts: Date.now(), supporter: true },
        },
      }),
    );
    setInput('');
  }

  return (
    <div
      className={`border-border bg-background flex flex-col rounded-lg border ${
        rail ? 'h-full min-h-0 flex-1' : 'max-h-[28rem]'
      }`}
    >
      <div className="border-border flex items-center gap-2 border-b px-3 py-2">
        <Button
          size="icon-sm"
          variant="text"
          onClick={onLeave}
          aria-label="Back to the public chat"
        >
          <ArrowLeftIcon size={16} aria-hidden />
        </Button>
        <div className="font-display text-sm font-bold">Fan room</div>
        <span className="text-foreground-secondary text-xs">
          {connected ? 'Subscribers only' : 'Connecting…'}
        </span>
      </div>
      {error && (
        <div className="text-foreground-secondary border-border border-b px-3 py-2 text-xs">
          {error}
        </div>
      )}
      <div
        role="log"
        aria-live="polite"
        aria-label="Fan room messages"
        className={`space-y-2 overflow-y-auto px-3 py-2 text-sm ${rail ? 'min-h-0 flex-1' : 'flex-1'}`}
      >
        {messages.length === 0 && (
          <EmptyState
            size="sm"
            title="Just fans in here"
            description="Only the artist and their subscribers see this room."
          />
        )}
        {messages.map((m) => (
          <div key={m.id} className="flex items-start gap-1.5 leading-snug">
            <ChatAvatar handle={m.handle} />
            <p className="min-w-0">
              <span className="font-semibold">{m.handle}</span>{' '}
              <span className="break-words">{m.text}</span>
            </p>
          </div>
        ))}
      </div>
      <form
        className="border-border flex gap-2 border-t px-3 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message the fan room"
          aria-label="Message the fan room"
          maxLength={500}
          disabled={!connected}
        />
        <Button type="submit" size="sm" disabled={!connected || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
