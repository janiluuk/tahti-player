/** ISO string -> `datetime-local` input value in the viewer's own timezone.
 * The input has no timezone of its own, so `toISOString()` would silently
 * relabel UTC as local time. */
export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `datetime-local` input value (viewer's local time) -> UTC ISO string, or
 * null when the value is empty or not a valid date. */
export function fromDatetimeLocalValue(value: string): string | null {
  if (!value.trim()) {
    return null;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
