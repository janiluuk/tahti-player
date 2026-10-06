/** Admin → Radio page sections (audit: Feature · Presets · Opt-outs · History). */
export const ADMIN_RADIO_TABS = [
  'feature',
  'presets',
  'opt-outs',
  'history',
] as const;

export type AdminRadioTabId = (typeof ADMIN_RADIO_TABS)[number];

export function isAdminRadioTabId(
  value: string | undefined,
): value is AdminRadioTabId {
  return Boolean(
    value && (ADMIN_RADIO_TABS as readonly string[]).includes(value),
  );
}

export function adminRadioTabFromSearch(
  tab: string | undefined,
): AdminRadioTabId {
  return isAdminRadioTabId(tab) ? tab : 'feature';
}
