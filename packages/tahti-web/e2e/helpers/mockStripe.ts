import type { Page, Route } from '@playwright/test';

import { waitForE2eHooks, type TahtiE2eHooks } from './e2eHooks';

type RecordedFanSub = {
  fanUsername: string;
  fanDisplayName: string;
  tierName: string;
  amountCents: number;
};

type RecordedTrackOrder = {
  fanUsername: string;
  fanDisplayName: string;
  title: string;
};

const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

function payoutRow(input: {
  id: string;
  tierName: string;
  grossCents: number;
  createdAt: string;
}) {
  const netToArtistCents = Math.round(input.grossCents * 0.89);
  return {
    id: input.id,
    state: 'PAID',
    tierName: input.tierName,
    grossCents: input.grossCents,
    netToArtistCents,
    paidAt: input.createdAt,
    createdAt: input.createdAt,
  };
}

function auditRow(input: {
  id: string;
  action: string;
  actorUsername: string;
  actorDisplayName: string;
  meta: Record<string, unknown>;
  createdAt: string;
}) {
  return {
    id: input.id,
    action: input.action,
    actorId: `e2e-${input.actorUsername}`,
    actorDisplayName: input.actorDisplayName,
    actorUsername: input.actorUsername,
    targetId: null,
    meta: input.meta,
    createdAt: input.createdAt,
  };
}

export async function installStripeMock(
  page: Page,
  state: {
    fanSubs: RecordedFanSub[];
    trackOrders: RecordedTrackOrder[];
  },
): Promise<void> {
  await page.route('https://checkout.stripe.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><title>Stripe mock</title><p>Stripe Checkout is mocked for this test.</p>',
    });
  });

  await page.route('**/archive/**/download**', async (route: Route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    const url = new URL(route.request().url());
    if (url.searchParams.get('format')) {
      await route.continue();
      return;
    }
    url.searchParams.set('format', 'source');
    await route.continue({ url: url.toString() });
  });

  await page.route('**/api/v1/u/*/subscribe', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        activated: true,
        subscriptionId: `stripe-mock-${Date.now()}`,
        tierName: 'Supporter',
        amountCents: 500,
        currentPeriodEnd: new Date(Date.now() + PERIOD_MS).toISOString(),
      }),
    });
    state.fanSubs.push({
      fanUsername: 'pending',
      fanDisplayName: 'pending',
      tierName: 'Supporter',
      amountCents: 500,
    });
  });

  await page.route('**/api/me/fan-sub-payouts', async (route: Route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    const json = (await response.json()) as {
      activeSubscribers?: number;
      thisMonthNetCents?: number;
      paidYtdNetCents?: number;
      pending?: number;
      failed?: number;
      paidLast30Days?: number;
      recent?: Array<ReturnType<typeof payoutRow>>;
    };
    const createdAt = new Date().toISOString();
    const extra = [
      ...state.fanSubs.map((sub, index) =>
        payoutRow({
          id: `e2e-fan-sub-${index}`,
          tierName: sub.tierName,
          grossCents: sub.amountCents,
          createdAt,
        }),
      ),
      ...state.trackOrders.map((order, index) =>
        payoutRow({
          id: `e2e-track-${index}`,
          tierName: `Track purchase — ${order.title}`,
          grossCents: 500,
          createdAt,
        }),
      ),
    ];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...json,
        activeSubscribers: (json.activeSubscribers ?? 0) + state.fanSubs.length,
        recent: [...extra, ...(json.recent ?? [])],
      }),
    });
  });

  await page.route('**/api/admin/audit**', async (route: Route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    const json = (await response.json()) as {
      page?: number;
      limit?: number;
      total?: number;
      items?: Array<ReturnType<typeof auditRow>>;
    };
    const createdAt = new Date().toISOString();
    const extra = [
      ...state.fanSubs.map((sub, index) =>
        auditRow({
          id: `e2e-audit-sub-${index}`,
          action: 'FAN_SUBSCRIPTION_CREATE',
          actorUsername: sub.fanUsername,
          actorDisplayName: sub.fanDisplayName,
          meta: { tierName: sub.tierName, amountCents: sub.amountCents },
          createdAt,
        }),
      ),
      ...state.trackOrders.map((order, index) =>
        auditRow({
          id: `e2e-audit-track-${index}`,
          action: 'LEDGER_ENTRY_CREATE',
          actorUsername: order.fanUsername,
          actorDisplayName: order.fanDisplayName,
          meta: { title: order.title, kind: 'track-purchase' },
          createdAt,
        }),
      ),
    ];
    const items = json.items ?? [];
    await route.fulfill({
      status: response.status(),
      contentType: 'application/json',
      body: JSON.stringify({
        ...json,
        total: (json.total ?? items.length) + extra.length,
        items: [...extra, ...items],
      }),
    });
  });
}

export async function grantBoardView(page: Page): Promise<void> {
  await waitForE2eHooks(page);
  await page.evaluate(() => {
    const raw = localStorage.getItem('tahti-web-auth');
    if (raw) {
      const parsed = JSON.parse(raw) as {
        state?: {
          user?: { isBoard?: boolean; roles?: string[]; role?: string };
        };
      };
      if (parsed.state?.user) {
        const roles = Array.from(
          new Set([...(parsed.state.user.roles ?? []), 'BOARD', 'ARTIST']),
        );
        parsed.state.user.isBoard = true;
        parsed.state.user.roles = roles;
        parsed.state.user.role = 'BOARD';
        localStorage.setItem('tahti-web-auth', JSON.stringify(parsed));
      }
    }
    const session = (window as unknown as { __tahtiE2e: TahtiE2eHooks })
      .__tahtiE2e;
    const user = session.getMockSessionUser();
    if (user) {
      session.setMockSessionUser({
        ...user,
        isBoard: true,
        role: 'BOARD',
        roles: Array.from(new Set([...(user.roles ?? []), 'BOARD', 'ARTIST'])),
      });
    }
  });
  await page.route('**/api/auth/me', async (route: Route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    const json = (await response.json()) as {
      isBoard?: boolean;
      roles?: string[];
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...json,
        isBoard: true,
        roles: Array.from(new Set([...(json.roles ?? []), 'BOARD', 'ARTIST'])),
      }),
    });
  });
  await page.reload();
}

export function rememberFanOnLatestSub(
  state: { fanSubs: RecordedFanSub[] },
  fan: { username: string; displayName: string },
): void {
  const latest = state.fanSubs[state.fanSubs.length - 1];
  if (latest && latest.fanUsername === 'pending') {
    latest.fanUsername = fan.username;
    latest.fanDisplayName = fan.displayName;
  }
}
