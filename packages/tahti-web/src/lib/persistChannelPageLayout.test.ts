import { afterEach, describe, expect, it, vi } from 'vitest';

import { patchChannelVisual } from '../api/channel-design/patch';
import {
  loadChannelPageLayout,
  parseChannelPageLayout,
} from './channelPageLayout';
import { persistChannelPageLayout } from './persistChannelPageLayout';

vi.mock('../api/channel-design/patch', () => ({
  patchChannelVisual: vi.fn(),
}));

const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: { error: (msg: string) => toastError(msg) },
}));

const layout = [
  { id: 'hero', type: 'hero' as const, visible: true },
  { id: 'headerStats', type: 'headerStats' as const, visible: false },
];

describe('parseChannelPageLayout', () => {
  it('reads a saved layout and fills in missing types', () => {
    const parsed = parseChannelPageLayout(JSON.stringify(layout));
    expect(parsed?.find((i) => i.id === 'hero')?.visible).toBe(true);
    expect(parsed?.find((i) => i.type === 'headerStats')?.visible).toBe(false);
    expect(parsed?.some((i) => i.type === 'avatar')).toBe(true);
  });

  it.each([null, undefined, '', '[]', '{}', 'not json'])(
    'returns null for %p',
    (json) => {
      expect(parseChannelPageLayout(json)).toBeNull();
    },
  );
});

describe('persistChannelPageLayout', () => {
  afterEach(() => {
    vi.mocked(patchChannelVisual).mockReset();
    toastError.mockReset();
    localStorage.clear();
  });

  it('saves locally and on the channel', async () => {
    vi.mocked(patchChannelVisual).mockResolvedValue({
      ok: true,
      data: {} as never,
    });
    await expect(persistChannelPageLayout('aino', layout)).resolves.toBe(true);
    const sent = vi.mocked(patchChannelVisual).mock.calls[0]?.[0].pageLayout;
    expect(sent?.find((i) => i.type === 'headerStats')?.visible).toBe(false);
    expect(
      loadChannelPageLayout('aino').find((i) => i.type === 'headerStats')
        ?.visible,
    ).toBe(false);
    expect(toastError).not.toHaveBeenCalled();
  });

  it('keeps the local copy and says so when the server save fails', async () => {
    vi.mocked(patchChannelVisual).mockResolvedValue({
      ok: false,
      error: 'nope',
    });
    await expect(persistChannelPageLayout('aino', layout)).resolves.toBe(false);
    expect(
      loadChannelPageLayout('aino').find((i) => i.id === 'hero')?.visible,
    ).toBe(true);
    expect(toastError).toHaveBeenCalledOnce();
  });
});
