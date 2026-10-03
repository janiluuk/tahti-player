import { ButtonLink } from '@tahti-player/ui';

import type { ChatErrorAction } from '../lib/chatErrors';

export function ChatNotice({
  message,
  action,
  artistUsername,
}: {
  message: string;
  action: ChatErrorAction;
  artistUsername: string | null;
}) {
  return (
    <div
      role="status"
      className="text-foreground-secondary border-border flex flex-wrap items-center gap-2 border-b px-3 py-2 text-xs"
    >
      <span>{message}</span>
      {action === 'subscribe' && artistUsername && (
        <ButtonLink
          to="/subscribe/$username"
          params={{ username: artistUsername }}
          size="xs"
          variant="secondary"
        >
          Subscribe
        </ButtonLink>
      )}
    </div>
  );
}
