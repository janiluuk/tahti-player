import { describe, expect, it } from 'vitest';

import { settingsSectionRoute } from './routes-settings';

function redirectFor(section: string): unknown {
  const beforeLoad = settingsSectionRoute.options.beforeLoad as (ctx: {
    params: { section: string };
  }) => void;
  try {
    beforeLoad({ params: { section } });
  } catch (thrown) {
    const { to, search } = (
      thrown as { options: { to: string; search: unknown } }
    ).options;
    return { to, search };
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
  });
});
