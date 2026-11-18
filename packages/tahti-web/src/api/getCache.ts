import { isForceMock } from './mode';

const TTL_MS = 30_000;
const MAX_ENTRIES = 300;

/** Responses that must always be live: playback position, presence, chat,
 * notification counts, session/auth state and health checks. */
const LIVE_PATH =
  /\/(auth|session|now-?playing|presence|chat|notifications|unread|heartbeat|status|health|live|listeners|centrifugo|queue)(\/|\?|$)/i;

type Entry = { at: number; value: unknown };

const entries = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();
let generation = 0;
let enabledOverride: boolean | null = null;

function enabled(): boolean {
  if (enabledOverride !== null) {
    return enabledOverride;
  }
  return import.meta.env.MODE !== 'test' && !isForceMock();
}

export function isCacheableGet(path: string): boolean {
  return !LIVE_PATH.test(path.split('#')[0] ?? path);
}

/**
 * Serves a recent successful GET from memory and shares one request between
 * callers asking for the same URL at once, so going back to a page does not
 * wait on the network again. Any write through the shared API helpers clears
 * everything (`clearGetCache`), and entries expire after 30 s.
 */
export function cachedGet<T>(key: string, load: () => Promise<T>): Promise<T> {
  if (!enabled() || !isCacheableGet(key)) {
    return load();
  }
  const hit = entries.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return Promise.resolve(hit.value as T);
  }
  const pending = inflight.get(key);
  if (pending) {
    return pending as Promise<T>;
  }
  const startedAt = generation;
  const request = load().then(
    (value) => {
      inflight.delete(key);
      // A write cleared the cache while this GET was in flight, so its
      // response may predate the write; hand it back but don't keep it.
      if (startedAt === generation) {
        entries.delete(key);
        entries.set(key, { at: Date.now(), value });
        if (entries.size > MAX_ENTRIES) {
          const oldest = entries.keys().next().value;
          if (oldest !== undefined) {
            entries.delete(oldest);
          }
        }
      }
      return value;
    },
    (err: unknown) => {
      inflight.delete(key);
      throw err;
    },
  );
  inflight.set(key, request);
  return request;
}

export function clearGetCache(): void {
  generation += 1;
  entries.clear();
  inflight.clear();
}

/** Tests only: force the cache on or off regardless of mode. `null` restores
 * the default. */
export function setGetCacheEnabledForTests(value: boolean | null): void {
  enabledOverride = value;
  clearGetCache();
}
