import { relativeDate } from './relativeDate';

/** Story cards use the shared date style (see `relativeDate`). */
export function storyDate(iso: string, now = new Date()): string {
  return relativeDate(iso, now);
}
