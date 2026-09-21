// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { PublicChannel } from '../../api/types';
import { useChannelLinksDraft } from './useChannelLinksDraft';

const channel = (links?: { label: string; url: string }[]) =>
  ({ slug: 'a', channelLinks: links }) as unknown as PublicChannel;

describe('useChannelLinksDraft', () => {
  it('seeds from the channel and is clean', () => {
    const links = [{ label: 'Site', url: 'https://x.test' }];
    const { result } = renderHook(() =>
      useChannelLinksDraft(channel(links), {}),
    );
    expect(result.current.links).toEqual(links);
    expect(result.current.dirty).toBe(false);
  });

  it('prefills an empty channel from social links, skipping non-links', () => {
    const { result } = renderHook(() =>
      useChannelLinksDraft(channel([]), {
        bandcamp: 'https://b.test',
        genres: 'techno',
      }),
    );
    expect(result.current.links).toEqual([
      { label: 'Bandcamp', url: 'https://b.test' },
    ]);
  });

  it('never overwrites what the user already typed', () => {
    const social = { bandcamp: 'https://b.test' };
    const ch = channel([]);
    const { result, rerender } = renderHook(
      ({ s }) => useChannelLinksDraft(ch, s),
      { initialProps: { s: {} as Record<string, string> } },
    );
    act(() => result.current.edit([]));
    expect(result.current.dirty).toBe(true);
    rerender({ s: social });
    expect(result.current.links).toEqual([]);
  });
});
