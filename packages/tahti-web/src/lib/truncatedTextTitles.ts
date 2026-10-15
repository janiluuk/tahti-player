const CUT_OFF_SELECTOR =
  '.truncate, .line-clamp-1, .line-clamp-2, .line-clamp-3, .line-clamp-4, .line-clamp-5, .line-clamp-6';

function isCutOff(el: HTMLElement) {
  return (
    el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1
  );
}

/**
 * Gives text cut off with an ellipsis or a line clamp its full text as a
 * hover title, unless the element already has a title of its own.
 */
export function startTruncatedTextTitles(root: Document = document) {
  const onPointerOver = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const el = target.closest<HTMLElement>(CUT_OFF_SELECTOR);
    if (!el) {
      return;
    }
    const autoTitled = el.dataset.autoTitle === 'true';
    if (el.hasAttribute('title') && !autoTitled) {
      return;
    }
    const text = el.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    if (text && isCutOff(el)) {
      el.title = text;
      el.dataset.autoTitle = 'true';
    } else if (autoTitled) {
      el.removeAttribute('title');
      delete el.dataset.autoTitle;
    }
  };
  root.addEventListener('pointerover', onPointerOver);
  return () => root.removeEventListener('pointerover', onPointerOver);
}
