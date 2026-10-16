import type { ChatMessage } from './types';

const STORAGE_KEY = 'tahti.mockChatBySlug';

function readAll(): Record<string, ChatMessage[]> {
  if (typeof sessionStorage === 'undefined') {
    return memory;
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, ChatMessage[]>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(next: Record<string, ChatMessage[]>): void {
  memory = next;
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}

let memory: Record<string, ChatMessage[]> = {};

export function appendMockChatMessage(
  slug: string,
  message: Omit<ChatMessage, 'id'> & { id?: string },
): ChatMessage {
  const next: ChatMessage = {
    id: message.id ?? `local-${slug}-${Date.now()}`,
    handle: message.handle,
    text: message.text,
    ts: message.ts,
    system: message.system,
    supporter: message.supporter,
    channelRole: message.channelRole,
    countryCode: message.countryCode,
  };
  const all = readAll();
  const list = [...(all[slug] ?? []), next].slice(-100);
  writeAll({ ...all, [slug]: list });
  return next;
}

export function mockChatStoreMessages(slug: string): ChatMessage[] {
  return [...(readAll()[slug] ?? [])];
}

export function resetMockChatStore(): void {
  memory = {};
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}
