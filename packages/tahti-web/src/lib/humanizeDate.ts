import { relativeDate } from './relativeDate';

/** The shared listing date style (see `relativeDate`); an unparsable value
 * is shown as given. */
export function humanizePastDate(iso: string, now = new Date()): string {
  return relativeDate(iso, now) || iso;
}
