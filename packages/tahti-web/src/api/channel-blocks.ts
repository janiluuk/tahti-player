import type { DiscoWidgetRenderItem } from './disco-widgets';
import {
  allowMockFallback,
  apiErrorMeta,
  isForceMock,
  mockFallbackMeta,
  type FetchMeta,
} from './mode';
import { requestJson } from './request-json';

export type ChannelBlockWidth = 'FULL' | 'HALF' | 'THIRD';
export type ChannelBlockType = 'LOGO' | 'ADDON';

/** `GET /api/me/channel/blocks` row. `configJson` is `{ addonInstallId }`
 * for ADDON and `{ assetId, url }` for LOGO. */
export type ChannelBlockView = {
  id: string;
  type: ChannelBlockType;
  width: ChannelBlockWidth;
  position: number;
  configJson: unknown;
};

/** `GET /api/v1/channels/:slug/blocks` row: a logo URL or an add-on to
 * frame, never raw config. Blocks whose add-on is gone are left out. */
export type PublicChannelBlock = {
  id: string;
  type: ChannelBlockType;
  width: ChannelBlockWidth;
  position: number;
  logoUrl: string | null;
  addon: DiscoWidgetRenderItem | null;
};

type ActionResult<T = void> =
  { error: null; data: T } | { error: string; data?: undefined };

const MOCK_ERROR = 'Channel blocks are unavailable in mock mode';

function failure(err: unknown, fallback: string): { error: string } {
  return { error: err instanceof Error ? err.message : fallback };
}

export function addonInstallIdOf(block: ChannelBlockView): string | null {
  const config = block.configJson as { addonInstallId?: unknown } | null;
  return block.type === 'ADDON' && typeof config?.addonInstallId === 'string'
    ? config.addonInstallId
    : null;
}

export async function fetchChannelBlocks(slug: string): Promise<{
  data: PublicChannelBlock[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return { data: [], meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const { data } = await requestJson<{ blocks: PublicChannelBlock[] }>(
      `/api/v1/channels/${encodeURIComponent(slug)}/blocks`,
    );
    return { data: data.blocks, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: [],
      meta: allowMockFallback() ? mockFallbackMeta(err) : apiErrorMeta(err),
    };
  }
}

export async function fetchMyChannelBlocks(): Promise<
  ActionResult<ChannelBlockView[]>
> {
  if (isForceMock()) {
    return { error: null, data: [] };
  }
  try {
    const { data } = await requestJson<{ blocks: ChannelBlockView[] }>(
      '/api/me/channel/blocks',
    );
    return { error: null, data: data.blocks };
  } catch (err) {
    return failure(err, 'Could not load the channel layout');
  }
}

export async function createAddonBlock(
  addonInstallId: string,
  width: ChannelBlockWidth,
): Promise<ActionResult<ChannelBlockView>> {
  if (isForceMock()) {
    return { error: MOCK_ERROR };
  }
  try {
    const { data } = await requestJson<ChannelBlockView>(
      '/api/me/channel/blocks',
      {
        method: 'POST',
        body: JSON.stringify({
          type: 'ADDON',
          width,
          configJson: { addonInstallId },
        }),
      },
    );
    return { error: null, data };
  } catch (err) {
    return failure(err, 'Could not place the add-on');
  }
}

export async function patchChannelBlockWidth(
  id: string,
  width: ChannelBlockWidth,
): Promise<ActionResult<ChannelBlockView>> {
  if (isForceMock()) {
    return { error: MOCK_ERROR };
  }
  try {
    const { data } = await requestJson<ChannelBlockView>(
      `/api/me/channel/blocks/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify({ width }) },
    );
    return { error: null, data };
  } catch (err) {
    return failure(err, 'Could not change the width');
  }
}

export async function reorderChannelBlocks(
  ids: string[],
): Promise<ActionResult> {
  if (isForceMock()) {
    return { error: MOCK_ERROR };
  }
  try {
    await requestJson<void>('/api/me/channel/blocks/reorder', {
      method: 'PUT',
      body: JSON.stringify({ ids }),
    });
    return { error: null, data: undefined };
  } catch (err) {
    return failure(err, 'Could not reorder the channel layout');
  }
}

export async function deleteChannelBlock(id: string): Promise<ActionResult> {
  if (isForceMock()) {
    return { error: MOCK_ERROR };
  }
  try {
    await requestJson<void>(
      `/api/me/channel/blocks/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    );
    return { error: null, data: undefined };
  } catch (err) {
    return failure(err, 'Could not remove the block');
  }
}
