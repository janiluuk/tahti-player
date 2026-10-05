import type { LucideIcon } from 'lucide-react';

export type TabGroup = {
  id: string;
  label: string;
  Icon: LucideIcon;
  /** Ids of the tabs shown under this group, in order. */
  tabIds: readonly string[];
};

export type GroupedTabs<T> = { group: TabGroup; tabs: T[] }[];

/** Sorts tabs into their groups; a group with none of its tabs is dropped. */
export function groupTabs<T extends { id: string }>(
  groups: readonly TabGroup[],
  tabs: readonly T[],
): GroupedTabs<T> {
  return groups
    .map((group) => ({
      group,
      tabs: group.tabIds.flatMap((id) => tabs.filter((tab) => tab.id === id)),
    }))
    .filter((entry) => entry.tabs.length > 0);
}

/** Where a deep link to one tab lands among the groups actually shown. */
export function tabLanding<T extends { id: string }>(
  grouped: GroupedTabs<T>,
  tabId: string | null,
): { group: number; tab: number } {
  for (const [group, entry] of grouped.entries()) {
    const tab = entry.tabs.findIndex((item) => item.id === tabId);
    if (tab >= 0) {
      return { group, tab };
    }
  }
  return { group: 0, tab: 0 };
}
