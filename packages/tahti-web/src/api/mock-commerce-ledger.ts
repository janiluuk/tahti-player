/**
 * Cross-tab mock commerce ledger for VITE_FORCE_MOCK.
 * Fan subscribe / purchase and artist Audience / Admin activity share
 * localStorage so a single Playwright browser context sees one ledger.
 */

export type MockCommerceFanSub = {
  id: string;
  fanUsername: string;
  fanDisplayName: string;
  artistUsername: string;
  tierName: string;
  amountCents: number;
  createdAt: string;
};

export type MockCommerceTrackOrder = {
  id: string;
  fanUsername: string;
  fanDisplayName: string;
  artistUsername: string;
  title: string;
  amountCents: number;
  createdAt: string;
};

export type MockCommerceAudit = {
  id: string;
  action: string;
  actorUsername: string;
  actorDisplayName: string;
  meta: Record<string, unknown>;
  createdAt: string;
};

type Ledger = {
  fanSubs: MockCommerceFanSub[];
  trackOrders: MockCommerceTrackOrder[];
  audit: MockCommerceAudit[];
  purchasesByUser: Record<string, string[]>;
};

const STORAGE_KEY = 'tahti-mock-commerce-ledger';

function emptyLedger(): Ledger {
  return {
    fanSubs: [],
    trackOrders: [],
    audit: [],
    purchasesByUser: {},
  };
}

let memoryLedger: Ledger = emptyLedger();

function readLedger(): Ledger {
  if (typeof localStorage === 'undefined') {
    return {
      fanSubs: [...memoryLedger.fanSubs],
      trackOrders: [...memoryLedger.trackOrders],
      audit: [...memoryLedger.audit],
      purchasesByUser: { ...memoryLedger.purchasesByUser },
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyLedger();
    }
    const parsed = JSON.parse(raw) as Partial<Ledger>;
    return {
      fanSubs: Array.isArray(parsed.fanSubs) ? parsed.fanSubs : [],
      trackOrders: Array.isArray(parsed.trackOrders) ? parsed.trackOrders : [],
      audit: Array.isArray(parsed.audit) ? parsed.audit : [],
      purchasesByUser:
        parsed.purchasesByUser && typeof parsed.purchasesByUser === 'object'
          ? parsed.purchasesByUser
          : {},
    };
  } catch {
    return emptyLedger();
  }
}

function writeLedger(ledger: Ledger): void {
  memoryLedger = {
    fanSubs: [...ledger.fanSubs],
    trackOrders: [...ledger.trackOrders],
    audit: [...ledger.audit],
    purchasesByUser: { ...ledger.purchasesByUser },
  };
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ledger));
}

export function listMockCommerceFanSubs(): MockCommerceFanSub[] {
  return readLedger().fanSubs;
}

export function listMockCommerceTrackOrders(): MockCommerceTrackOrder[] {
  return readLedger().trackOrders;
}

export function listMockCommerceAudit(): MockCommerceAudit[] {
  return readLedger().audit;
}

export function recordMockFanSub(input: {
  fanUsername: string;
  fanDisplayName: string;
  artistUsername: string;
  tierName: string;
  amountCents: number;
}): MockCommerceFanSub {
  const ledger = readLedger();
  const createdAt = new Date().toISOString();
  const row: MockCommerceFanSub = {
    id: `mock-commerce-sub-${Date.now()}-${ledger.fanSubs.length}`,
    ...input,
    createdAt,
  };
  ledger.fanSubs = [
    ...ledger.fanSubs.filter(
      (sub) =>
        !(
          sub.fanUsername === input.fanUsername &&
          sub.artistUsername === input.artistUsername
        ),
    ),
    row,
  ];
  ledger.audit = [
    {
      id: `mock-audit-sub-${row.id}`,
      action: 'FAN_SUBSCRIPTION_CREATE',
      actorUsername: input.fanUsername,
      actorDisplayName: input.fanDisplayName,
      meta: {
        tierName: input.tierName,
        amountCents: input.amountCents,
        artistUsername: input.artistUsername,
      },
      createdAt,
    },
    ...ledger.audit,
  ];
  writeLedger(ledger);
  return row;
}

export function recordMockTrackPurchase(input: {
  fanUsername: string;
  fanDisplayName: string;
  artistUsername: string;
  title: string;
  amountCents: number;
  tierId: string;
}): MockCommerceTrackOrder {
  const ledger = readLedger();
  const createdAt = new Date().toISOString();
  const row: MockCommerceTrackOrder = {
    id: `mock-commerce-track-${Date.now()}-${ledger.trackOrders.length}`,
    fanUsername: input.fanUsername,
    fanDisplayName: input.fanDisplayName,
    artistUsername: input.artistUsername,
    title: input.title,
    amountCents: input.amountCents,
    createdAt,
  };
  ledger.trackOrders = [...ledger.trackOrders, row];
  const owned = new Set(ledger.purchasesByUser[input.fanUsername] ?? []);
  owned.add(input.tierId);
  ledger.purchasesByUser[input.fanUsername] = Array.from(owned);
  ledger.audit = [
    {
      id: `mock-audit-track-${row.id}`,
      action: 'LEDGER_ENTRY_CREATE',
      actorUsername: input.fanUsername,
      actorDisplayName: input.fanDisplayName,
      meta: {
        title: input.title,
        kind: 'track-purchase',
        amountCents: input.amountCents,
        artistUsername: input.artistUsername,
      },
      createdAt,
    },
    ...ledger.audit,
  ];
  writeLedger(ledger);
  return row;
}

export function mockUserOwnsPurchaseTier(
  fanUsername: string,
  tierId: string,
): boolean {
  return (readLedger().purchasesByUser[fanUsername] ?? []).includes(tierId);
}

export function clearMockCommerceLedger(): void {
  writeLedger(emptyLedger());
}
