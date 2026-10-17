import { isHttpUrl } from './parseRss';

/** Outbound channel / governance links: http(s) only (blocks javascript: etc.). */
export function isSafeHref(value: string | null | undefined): boolean {
  if (!value?.trim()) {
    return false;
  }
  return isHttpUrl(value);
}

/** Channel link rows may also use mailto:; anything else is rejected. */
export function isSafeChannelLinkUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }
  if (trimmed.toLowerCase().startsWith('mailto:')) {
    return (
      trimmed.includes('@') && !trimmed.toLowerCase().includes('javascript:')
    );
  }
  return isHttpUrl(trimmed);
}
