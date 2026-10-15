import { apiGet } from '../api-client.mjs';
import { formatDate, formatTable, safeName } from '../format.mjs';

export function formatAmount(cents) {
  return typeof cents === 'number' ? (cents / 100).toFixed(2) : null;
}

export function formatPurchasesTable(purchases) {
  return formatTable(
    ['DATE', 'ARTIST', 'TIER', 'EUR', 'TRACKS'],
    purchases.map((purchase) => [
      formatDate(purchase.createdAt),
      purchase.artist
        ? safeName(purchase.artist.displayName, purchase.artist.username)
        : null,
      purchase.tierName,
      formatAmount(purchase.amountCents),
      (purchase.tracks ?? []).map((track) => track.title).join(', '),
    ]),
  );
}

export async function runPurchases(config, { json = false } = {}) {
  const purchases = await apiGet('/api/me/purchases', config);
  if (json) {
    return JSON.stringify(purchases, null, 2);
  }
  if (purchases.length === 0) {
    return 'No purchases yet.';
  }
  return formatPurchasesTable(purchases);
}
