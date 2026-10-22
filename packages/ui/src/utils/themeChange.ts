const ROOT_ATTRIBUTES = [
  'class',
  'style',
  'data-theme',
  'data-theme-id',
  'data-custom-theme-id',
];

/** Calls `onChange` (at most once per frame) after the app theme changes:
 * attributes on `<html>`, injected theme `<style>` in `<head>`, or the OS
 * colour scheme. Canvas renderers such as wavesurfer read colours once, so
 * they need this to follow a theme switch. */
export function observeThemeChange(onChange: () => void): () => void {
  if (typeof document === 'undefined') {
    return () => undefined;
  }
  let frame = 0;
  const schedule = () => {
    if (frame) {
      return;
    }
    frame = requestAnimationFrame(() => {
      frame = 0;
      onChange();
    });
  };
  const observer =
    typeof MutationObserver === 'undefined'
      ? null
      : new MutationObserver(schedule);
  observer?.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ROOT_ATTRIBUTES,
  });
  observer?.observe(document.head, {
    childList: true,
    characterData: true,
    subtree: true,
  });
  const scheme =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;
  scheme?.addEventListener?.('change', schedule);
  return () => {
    observer?.disconnect();
    scheme?.removeEventListener?.('change', schedule);
    if (frame) {
      cancelAnimationFrame(frame);
    }
  };
}

export function readCssVar(
  el: Element,
  name: string,
  fallback: string,
): string {
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  return value || fallback;
}
