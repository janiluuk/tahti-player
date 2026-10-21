import { describe, expect, it } from 'vitest';

import { prodSubscribeAliasRoute } from './routes-embed';

function redirectFrom(search: Record<string, unknown>) {
  const validated = prodSubscribeAliasRoute.options.validateSearch!(search);
  try {
    (prodSubscribeAliasRoute.options.beforeLoad as (ctx: unknown) => void)({
      params: { username: 'aurora' },
      search: validated,
    });
  } catch (thrown) {
    return (thrown as { options: Record<string, unknown> }).options;
  }
  throw new Error('expected a redirect');
}

describe('prodSubscribeAliasRoute', () => {
  it('keeps the Stripe checkout result when redirecting', () => {
    expect(redirectFrom({ subscribed: 1 })).toMatchObject({
      to: '/subscribe/$username',
      params: { username: 'aurora' },
      search: { subscribed: 1 },
    });
    expect(redirectFrom({ canceled: 1 })).toMatchObject({
      search: { canceled: 1 },
    });
  });
});
