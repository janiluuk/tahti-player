import type { FingerprintResult } from '../../api/studio';

export type FingerprintOutcome =
  { ok: true; data: FingerprintResult } | { ok: false; error: string };

/**
 * A fingerprint provider owns everything about how it identifies a track —
 * its id/label and the two lookups a host UI needs. Adding a second
 * provider means implementing this interface, not adding a branch to
 * existing fingerprint code.
 */
export interface FingerprintProvider {
  id: string;
  label: string;
  /** Re-runs fingerprint + match lookup and replaces whatever's stored. */
  match(releaseId: string, trackId: string): Promise<FingerprintOutcome>;
  /** Same lookup, but never overwrites the stored fingerprint/match. */
  check(releaseId: string, trackId: string): Promise<FingerprintOutcome>;
}
