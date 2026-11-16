import { describe, expect, it } from 'vitest';

import { settingsSectionRoute } from './routes-settings';

function redirectFor(
  section: string,
  search: Record<string, unknown> = {},
): unknown {
  const beforeLoad = settingsSectionRoute.options.beforeLoad as (ctx: {
    params: { section: string };
    search: Record<string, unknown>;
  }) => void;
  try {
    beforeLoad({ params: { section }, search });
  } catch (thrown) {
    const {
      to,
      search: nextSearch,
      href,
    } = (
      thrown as { options: { to?: string; search?: unknown; href?: string } }
    ).options;
    return href ? { href } : { to, search: nextSearch };
  }
  return null;
}

describe('settingsSectionRoute', () => {
  it('sends a Settings → Money bookmark to Studio with a moved notice', () => {
    expect(redirectFor('money')).toEqual({
      to: '/studio/audience',
      search: { movedFrom: 'money' },
    });
  });

  it('sends a fan tiers bookmark to the tiers tab', () => {
    expect(redirectFor('fan-tiers')).toEqual({
      to: '/studio/audience',
      search: { tab: 'tiers', movedFrom: 'fan-tiers' },
    });
  });

  it('leaves sections that still live in Settings alone', () => {
    expect(redirectFor('account')).toBeNull();
    expect(redirectFor('artist', { tab: 'story' })).toBeNull();
  });

  it('sends Channel & chat and Broadcast bookmarks to their Studio pages', () => {
    expect(redirectFor('channel', { tab: 'discovery' })).toEqual({
      href: '/studio/profile/discovery',
    });
    expect(redirectFor('broadcast', { tab: 'radio' })).toEqual({
      href: '/studio/recordings#recording-settings',
    });
  });
});
