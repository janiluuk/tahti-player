import { useCallback, useState } from 'react';

import { Button } from '@tahti-player/ui';

import { postChatReaction } from '../api/studio-extras';
import { useChannelReactions } from '../lib/useChannelReactions';
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

const INCOMING_VISIBLE_MS = 4000;
const INCOMING_MAX = 12;

type Incoming = { id: number; emoji: string };

let incomingId = 0;

export function ChatReactionBar({
  slug,
  onError,
}: {
  slug: string;
  onError: (message: string) => void;
}) {
  const [sent, setSent] = useState<(typeof REACTION_EMOJIS)[number] | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [incoming, setIncoming] = useState<Incoming[]>([]);

  const showIncoming = useCallback((emoji: string) => {
    const id = ++incomingId;
    setIncoming((prev) => [...prev, { id, emoji }].slice(-INCOMING_MAX));
    window.setTimeout(
      () => setIncoming((prev) => prev.filter((item) => item.id !== id)),
      INCOMING_VISIBLE_MS,
    );
  }, []);

  useChannelReactions(slug, showIncoming);

  return (
    <div className="border-border flex flex-wrap items-center gap-1 border-b px-3 py-2">
      <Eyebrow className="mr-1">React</Eyebrow>
      {REACTION_EMOJIS.map((emoji) => (
        <Button
          key={emoji}
          size="xs"
          variant="text"
          disabled={busy}
          aria-label={`React with ${REACTION_EMOJI_LABELS[emoji]}`}
          onClick={() => {
            setBusy(true);
            void postChatReaction(slug, emoji).then((r) => {
              setBusy(false);
              if (r.ok) {
                setSent(emoji);
                window.setTimeout(() => setSent(null), 1200);
              } else {
                onError(r.error);
              }
            });
          }}
        >
          {emoji}
        </Button>
      ))}
      {sent && (
        <span className="text-foreground-secondary text-xs" role="status">
          Sent {sent}
          <span className="sr-only"> ({REACTION_EMOJI_LABELS[sent]})</span>
        </span>
      )}
      {incoming.length > 0 && (
        <span
          className="ml-auto flex gap-0.5 text-sm"
          aria-label="Listeners' reactions"
          data-testid="incoming-reactions"
        >
          {incoming.map((item) => (
            <span key={item.id} className="motion-safe:animate-bounce">
              {item.emoji}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
