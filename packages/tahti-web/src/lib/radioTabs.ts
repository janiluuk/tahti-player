export const RADIO_TABS = [
  'up-next',
  'shows',
  'just-played',
  'featured',
] as const;

export type RadioTab = (typeof RADIO_TABS)[number];

export type RadioSearch = {
  tab?: Exclude<RadioTab, 'up-next'>;
};

function isRadioTab(tab: unknown): tab is RadioTab {
  return RADIO_TABS.some((known) => known === tab);
}

export function radioTabFromSearch(tab: unknown): RadioTab {
  return isRadioTab(tab) ? tab : 'up-next';
}

export function parseRadioSearch(search: Record<string, unknown>): RadioSearch {
  const tab = radioTabFromSearch(search.tab);
  return { tab: tab === 'up-next' ? undefined : tab };
}
