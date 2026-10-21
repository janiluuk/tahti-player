/**
 * Friendly labels for the structured perk codes an artist can pick on a fan
 * tier. `FanTier.perks` is free text, so anything not listed here is an
 * artist's own custom perk and is shown as typed.
 */
export const FAN_TIER_PERK_LABELS = {
  FAN_CHAT: 'Fan chat',
  FAN_NEWSLETTER: 'Fan newsletter',
  EARLY_ACCESS: 'Early access',
  FLAC: 'Lossless downloads',
  EXCLUSIVE_CONTENT: 'Exclusive content',
} as const;

const LABEL_BY_KEY = new Map<string, string>(
  Object.entries(FAN_TIER_PERK_LABELS),
);

export function humanizeFanTierPerk(perk: string): string {
  return LABEL_BY_KEY.get(perk) ?? perk;
}
