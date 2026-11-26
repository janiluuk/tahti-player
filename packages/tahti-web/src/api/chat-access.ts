import { i18n } from '@tahti-player/i18n';

import { errorOr, getJson, requestJson } from './client-request';
import { mockChatAccess, mockChatHistory } from './mock';
import { mockFixture } from './mock-overrides';
import {
  allowMockFallback,
  isForceMock,
  withMockFallback,
  type FetchMeta,
} from './mode';
import type { ChatAccess, ChatMessage, ChatTokenResponse } from './types';

export async function fetchChatAccess(slug: string): Promise<{
  data: ChatAccess;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockFixture('chatAccess', mockChatAccess(), slug),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<ChatAccess>(
      `/api/chat/${encodeURIComponent(slug)}/access`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(
      err,
      allowMockFallback() ? mockChatAccess : null,
      () => ({
        fanChatEnabled: false,
        isSupporter: false,
        canJoinFanChat: false,
        subscribersOnly: false,
        canPostInChat: false,
      }),
    );
  }
}

export async function fetchChatHistory(slug: string): Promise<{
  data: ChatMessage[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockChatHistory(slug),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const raw = await getJson<{
      messages: Array<Omit<ChatMessage, 'id'> & { id?: string }>;
    }>(`/api/chat/${encodeURIComponent(slug)}/history`);
    const data = (raw.messages ?? []).map((m, i) => ({
      ...m,
      id: m.id ?? `history-${m.ts}-${i}`,
    }));
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(
      err,
      allowMockFallback() ? () => mockChatHistory(slug) : null,
      () => [],
    );
  }
}

export async function requestChatToken(
  slug: string,
  handle: string,
  hcaptchaToken?: string,
): Promise<{ data: ChatTokenResponse; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockFixture(
        'chatToken',
        {
          token: 'mock-token',
          handle,
          supporter: false,
          channelRole: null,
          countryCode: null,
        },
        slug,
        handle,
      ),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ChatTokenResponse>(
      `/api/chat/${encodeURIComponent(slug)}/token`,
      {
        method: 'POST',
        body: JSON.stringify({ handle, hcaptchaToken }),
      },
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    throw errorOr(err, i18n.t('web:batch56.couldNotJoinChat'));
  }
}

export async function requestChatViewerToken(
  slug: string,
): Promise<string | null> {
  if (isForceMock()) {
    return null;
  }
  try {
    const { data } = await requestJson<{ token: string }>(
      `/api/chat/${encodeURIComponent(slug)}/viewer-token`,
      { method: 'POST' },
    );
    return data.token;
  } catch {
    return null;
  }
}
