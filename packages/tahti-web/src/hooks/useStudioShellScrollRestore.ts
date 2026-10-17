import { useEffect, useRef } from 'react';

const STORAGE_PREFIX = 'tahti-shell-scroll:';

function scrollport(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-studio-shell]');
}

function storageKey(pathname: string): string {
  return `${STORAGE_PREFIX}${pathname}`;
}

function readScroll(pathname: string): number {
  try {
    const raw = sessionStorage.getItem(storageKey(pathname));
    if (raw == null) {
      return 0;
    }
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writeScroll(pathname: string, top: number): void {
  try {
    sessionStorage.setItem(storageKey(pathname), String(Math.max(0, top)));
  } catch {
    return;
  }
}

export function useStudioShellScrollRestore(pathname: string): void {
  const previousPathname = useRef(pathname);

  useEffect(() => {
    const el = scrollport();
    const leaving = previousPathname.current;
    if (el && leaving !== pathname) {
      writeScroll(leaving, el.scrollTop);
    }
    previousPathname.current = pathname;

    const top = readScroll(pathname);
    const frame = window.requestAnimationFrame(() => {
      const port = scrollport();
      if (!port) {
        return;
      }
      port.scrollTop = top;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);
}
