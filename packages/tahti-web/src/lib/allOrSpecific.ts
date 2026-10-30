export const ALL_FILTER_ID = '__all__';

/** A multi-select filter with an "All" chip: picking All clears every
 * specific choice; picking a specific one leaves All. */
export function allOrSpecific(
  selected: string[],
  previous: string[],
): string[] {
  const pickedAll = selected.includes(ALL_FILTER_ID) && previous.length > 0;
  return pickedAll ? [] : selected.filter((id) => id !== ALL_FILTER_ID);
}
