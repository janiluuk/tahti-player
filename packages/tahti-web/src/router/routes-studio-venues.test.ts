import { describe, expect, it } from 'vitest';

import { studioVenuesRoute } from './routes-studio';

describe('studioVenuesRoute', () => {
  it("sends the old dashboard's venues page to My venues, not the board's admin list", () => {
    let target: unknown;
    try {
      (studioVenuesRoute.options.beforeLoad as () => void)();
    } catch (thrown) {
      target = (thrown as { options: { to: string } }).options.to;
    }
    expect(target).toBe('/venues/mine');
  });
});
