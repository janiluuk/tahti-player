import { mockChatBans } from './artist-settings/mock';
import { isForceMock } from './mode';
import { requestJson } from './request-json';

/** A chat message as the channel's owner and moderators see it
 * (`GET /api/me/moderate/:slug/chat/messages`). The sender's fingerprint
 * stays on the server; `canBan` and `banned` say what can be done. */
export type ModerationChatMessage = {
  id: string;
  handle: string;
  text: string;
  fanOnly: boolean;
  channelRole: 'owner' | 'moderator' | null;
  createdAt: string;
  canBan: boolean;
  banned: boolean;
};

type Result = { ok: true } | { ok: false; error: string };

let mockMessages: ModerationChatMessage[] = [
  {
    id: 'mock-msg-3',
    handle: 'Promo Bot',
    text: 'Cheap followers, link in my profile',
    fanOnly: false,
    channelRole: null,
    createdAt: '2026-10-08T19:42:00.000Z',
    canBan: true,
    banned: false,
  },
  {
    id: 'mock-msg-2',
    handle: 'Aino',
    text: 'This set is unreal',
    fanOnly: true,
    channelRole: null,
    createdAt: '2026-10-08T19:40:00.000Z',
    canBan: true,
    banned: false,
  },
  {
    id: 'mock-msg-1',
    handle: 'Demo Artist',
    text: 'Welcome in, we start in five',
    fanOnly: false,
    channelRole: 'owner',
    createdAt: '2026-10-08T19:35:00.000Z',
    canBan: false,
    banned: false,
  },
];

function messagesPath(slug: string): string {
  return `/api/me/moderate/${encodeURIComponent(slug)}/chat/messages`;
}

/** The channel's latest chat messages, newest first, fan room included.
 * `ok: false` when the list could not be loaded. */
export async function fetchModerationMessages(
  slug: string,
): Promise<
  { ok: true; data: ModerationChatMessage[] } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return { ok: true, data: [...mockMessages] };
  }
  try {
    const { data } = await requestJson<{ messages: ModerationChatMessage[] }>(
      messagesPath(slug),
    );
    return { ok: true, data: data.messages ?? [] };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not load messages',
    };
  }
}

/** Takes a message out of the chat history for everyone who opens the chat
 * from now on. */
export async function removeChatMessage(
  slug: string,
  id: string,
): Promise<Result> {
  if (isForceMock()) {
    mockMessages = mockMessages.filter((m) => m.id !== id);
    return { ok: true };
  }
  try {
    await requestJson(`${messagesPath(slug)}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not remove message',
    };
  }
}

/** Bans whoever sent the message from posting in the channel's chat. */
export async function banChatMessageSender(
  slug: string,
  id: string,
): Promise<Result> {
  if (isForceMock()) {
    const sender = mockMessages.find((m) => m.id === id)?.handle;
    if (sender && !mockChatBans.some((b) => b.handle === sender)) {
      mockChatBans.unshift({
        id: `mock-ban-${id}`,
        fingerprintHash: `mock-${id}`,
        handle: sender,
        bannedAt: new Date().toISOString(),
      });
    }
    mockMessages = mockMessages.map((m) =>
      m.handle === sender ? { ...m, banned: true } : m,
    );
    return { ok: true };
  }
  try {
    await requestJson(`${messagesPath(slug)}/${encodeURIComponent(id)}/ban`, {
      method: 'POST',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not ban',
    };
  }
}

/** A channel whose chat the signed-in account looks after
 * (`GET /api/me/moderate`): its own, and those it moderates for others. */
export type ModeratedChannel = {
  slug: string;
  displayName: string;
  isOwner: boolean;
};

let mockModerated: ModeratedChannel[] = [
  { slug: 'demo', displayName: 'Demo Artist', isOwner: true },
  { slug: 'night-drive', displayName: 'Night Drive', isOwner: false },
];

export async function fetchModeratedChannels(): Promise<
  { ok: true; data: ModeratedChannel[] } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return { ok: true, data: [...mockModerated] };
  }
  try {
    const { data } = await requestJson<ModeratedChannel[]>('/api/me/moderate');
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not load channels',
    };
  }
}

/** Gives up the signed-in account's moderator role on someone else's
 * channel (`DELETE /api/me/moderate/:slug`). */
export async function stopModerating(slug: string): Promise<Result> {
  if (isForceMock()) {
    mockModerated = mockModerated.filter((c) => c.slug !== slug || c.isOwner);
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/moderate/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not step down',
    };
  }
}
