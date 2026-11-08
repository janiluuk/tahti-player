import { describe, expect, it } from 'vitest';

import { artistRoute, channelRoute } from './routes-library';

function redirectTo(
  route: typeof channelRoute | typeof artistRoute,
  ctx: { params: Record<string, string>; search?: Record<string, unknown> },
): string | null {
  const beforeLoad = route.options.beforeLoad as (c: typeof ctx) => void;
  try {
    beforeLoad({ search: {}, ...ctx });
  } catch (thrown) {
    return (thrown as { options: { to: string } }).options.to;
  }
  return null;
}

describe('Tahti Radio routes', () => {
  it('opens the Radio page from the Tahti Radio channel link', () => {
    expect(redirectTo(channelRoute, { params: { slug: 'tahti-radio' } })).toBe(
      '/radio',
    );
  });

  it('opens the Radio page from the Tahti Radio artist link', () => {
    expect(
      redirectTo(artistRoute, { params: { username: 'tahti-radio' } }),
    ).toBe('/radio');
  });

  it('keeps the channel page when the Radio page asks for it', () => {
    expect(
      redirectTo(channelRoute, {
        params: { slug: 'tahti-radio' },
        search: { view: 'channel' },
      }),
    ).toBeNull();
    expect(
      redirectTo(channelRoute, {
        params: { slug: 'tahti-radio' },
        search: { edit: true },
      }),
    ).toBeNull();
  });

  it('leaves other channels and artists alone', () => {
    expect(redirectTo(channelRoute, { params: { slug: 'demo' } })).toBeNull();
    expect(
      redirectTo(artistRoute, { params: { username: 'demo' } }),
    ).toBeNull();
  });
});
