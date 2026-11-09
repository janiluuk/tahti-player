import { ArrowLeftIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Input, Tooltip } from '@tahti-player/ui';

import {
  fetchFanChatHistory,
  MOCK_FAN_CHAT_TOKEN,
  requestFanChatToken,
} from '../api/fan-chat';
import { centrifugoWsUrl } from '../lib/centrifugoWsUrl';
import { chatErrorFor } from '../lib/chatErrors';
import { ChatAvatar } from './ChatAvatar';
import { PageEmpty } from './PageStates';

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
  const { t } = useTranslation('web');
  const [messages, setMessages] = useState<FanMessage[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const roomRef = useRef<{ channel: string; handle: string } | null>(null);
  const localEchoRef = useRef(false);
  const nextIdRef = useRef(1);
  const publishIdsRef = useRef(new Set<number>());

  useEffect(() => {
    let cancelled = false;
    void fetchFanChatHistory(slug).then((history) => {
      if (!cancelled && history.length > 0) {
        setMessages((live) => [
          ...history.map((m, i) => ({
            id: m.id ?? `history-${m.ts}-${i}`,
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
        const { token, channel, handle } = result.data;
        if (token === MOCK_FAN_CHAT_TOKEN) {
          roomRef.current = { channel, handle };
          localEchoRef.current = true;
          setError(null);
          setConnected(true);
          return;
        }
        if (!url) {
          return;
        }
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
                  pub?: {
                    data?: {
                      handle?: string;
                      text?: string;
                      messageId?: string;
                      removedMessageId?: string;
                    };
                  };
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
              const removedId = data?.removedMessageId;
              if (msg.push?.channel === channel && removedId) {
                setMessages((prev) => prev.filter((m) => m.id !== removedId));
                continue;
              }
              if (msg.push?.channel === channel && data?.text) {
                setMessages((prev) =>
                  [
                    ...prev,
                    {
                      id: data.messageId ?? `${Date.now()}-${Math.random()}`,
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
    if (!text || !room || !connected) {
      return;
    }
    if (localEchoRef.current) {
      setMessages((prev) =>
        [
          ...prev,
          {
            id: `local-${Date.now()}-${prev.length}`,
            handle: room.handle,
            text,
          },
        ].slice(-100),
      );
      setInput('');
      return;
    }
    if (!wsRef.current) {
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
        <Tooltip content={t('fanChatRoom.backToThePublicChat')} side="top">
          <Button
            size="icon-sm"
            variant="text"
            onClick={onLeave}
            aria-label={t('fanChatRoom.backToThePublicChat')}
          >
            <ArrowLeftIcon size={16} aria-hidden />
          </Button>
        </Tooltip>
        <div className="font-display text-sm font-bold">
          {t('fanChatRoom.fanRoom')}
        </div>
        <span className="text-foreground-secondary text-xs">
          {connected
            ? t('fanChatRoomStates.subscribersOnly')
            : t('fanChatRoomStates.connecting')}
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
        aria-label={t('fanChatRoom.fanRoomMessages')}
        className={`space-y-2 overflow-y-auto px-3 py-2 text-sm ${rail ? 'min-h-0 flex-1' : 'flex-1'}`}
      >
        {messages.length === 0 && (
          <PageEmpty
            title={t('empties.justFansInHere')}
            description={t('empties.onlyTheArtistAndTheirSubscribers')}
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
          placeholder={t('fanChatRoom.messageTheFanRoom')}
          aria-label={t('fanChatRoom.messageTheFanRoom')}
          maxLength={500}
          disabled={!connected}
        />
        <Button type="submit" size="sm" disabled={!connected || !input.trim()}>
          {t('fanChatRoom.send')}
        </Button>
      </form>
    </div>
  );
}
