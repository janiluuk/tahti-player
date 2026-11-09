// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

import { fetchChannel } from '../../api/client';
import { useChannelLook } from './useChannelLook';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
  Toaster: () => null,
}));

const options = { layoutSlug: 'test', reloadToken: 0 };

beforeEach(() => {
  vi.stubEnv('VITE_FORCE_MOCK', '1');
});

it('site title and visibility survive save, reload and public read', async () => {
  const first = renderHook(() => useChannelLook(options));
  await waitFor(() => expect(first.result.current.visual).not.toBeNull());
  act(() =>
    first.result.current.applyLocal({
      topBarText: 'On air tonight',
      showSiteSidebar: true,
      showSiteBottomBar: true,
      showSiteHeader: false,
    }),
  );
  await act(async () => {
    await first.result.current.save();
  });
  first.unmount();
  const second = renderHook(() => useChannelLook(options));
  await waitFor(() => expect(second.result.current.visual).not.toBeNull());
  const expected = {
    topBarText: 'On air tonight',
    showSiteSidebar: true,
    showSiteBottomBar: true,
    showSiteHeader: false,
  };
  expect(second.result.current.visual).toMatchObject(expected);
  expect((await fetchChannel('test')).data).toMatchObject(expected);
  second.unmount();
});
