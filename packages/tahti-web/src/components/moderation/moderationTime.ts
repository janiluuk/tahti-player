/** A moment in a moderation list: the date and the time to the minute, in
 * the reader's locale. Seconds only add noise there. */
export function moderationTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
