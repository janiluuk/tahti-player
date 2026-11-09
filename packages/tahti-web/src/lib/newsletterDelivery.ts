import type { NewsletterDelivery } from '../api/studio-extras/posts';
import { dateLocaleTag } from './locale';

/** "Delivered to 2 · 1 failed · 1 bounced · 1 still sending", or null when
 * nothing has been sent. */
export function newsletterDeliverySummary(
  delivery: NewsletterDelivery | undefined,
): string | null {
  if (!delivery) {
    return null;
  }
  const total =
    delivery.queued + delivery.sent + delivery.failed + delivery.bounced;
  if (total === 0) {
    return null;
  }
  const parts = [
    `Delivered to ${delivery.sent.toLocaleString(dateLocaleTag())}`,
  ];
  if (delivery.failed > 0) {
    parts.push(`${delivery.failed.toLocaleString(dateLocaleTag())} failed`);
  }
  if (delivery.bounced > 0) {
    parts.push(`${delivery.bounced.toLocaleString(dateLocaleTag())} bounced`);
  }
  if (delivery.queued > 0) {
    parts.push(
      `${delivery.queued.toLocaleString(dateLocaleTag())} still sending`,
    );
  }
  return parts.join(' · ');
}
