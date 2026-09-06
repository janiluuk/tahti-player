import { useRouterState } from '@tanstack/react-router';
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

import { cn } from '../lib/cn';
import { getPageTourSteps, type TourStep } from '../lib/pageTour';
import { useTourStore } from '../stores/tourStore';

function targetFor(step: TourStep): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-tour-id="${step.id}"]`);
}

/**
 * Guided tour of the current page (press H). Highlights nav items in place
 * with a cutout + glow, one at a time, walking through whichever ones
 * actually exist on the current page — sidebar always, the top bar only on
 * the homepage, Studio/Admin panel items while inside those sections. See
 * `lib/pageTour.ts` for the per-page step lists.
 */
export function PageTourSpotlight() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const open = useTourStore((s) => s.open);
  const stepIndex = useTourStore((s) => s.stepIndex);
  const close = useTourStore((s) => s.close);
  const setStepIndex = useTourStore((s) => s.setStepIndex);

  const [steps, setSteps] = useState<TourStep[]>([]);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Close whenever the route changes so a stale highlight never lingers.
  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) {
      return;
    }
    // Deferred so a sibling's own reaction to `open` (e.g. StudioNav
    // force-expanding its collapsed tools panel) has time to render and
    // commit its new nodes before we query the DOM for targets. A single
    // rAF isn't enough — that reaction is itself a `useEffect` that fires
    // after this one and only then schedules its own re-render, so the new
    // nodes land a render-commit cycle later than the first paint after
    // `open` flips. A short timeout reliably clears that extra cycle.
    const handle = window.setTimeout(() => {
      const available = getPageTourSteps(pathname).filter((step) =>
        targetFor(step),
      );
      setSteps(available);
    }, 60);
    return () => window.clearTimeout(handle);
  }, [open, pathname]);

  const step = steps[stepIndex];

  const measure = useCallback(() => {
    if (!step) {
      setRect(null);
      return;
    }
    const el = targetFor(step);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  // Layout effect: measures synchronously before paint so the ring never
  // shows a stale position from the previous step for even one frame,
  // which matters on fast key-repeat through ArrowRight/ArrowLeft.
  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    measure();
  }, [open, measure]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let rafId = 0;
    const throttledMeasure = () => {
      if (rafId) {
        return;
      }
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        measure();
      });
    };
    window.addEventListener('resize', throttledMeasure);
    window.addEventListener('scroll', throttledMeasure, true);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', throttledMeasure);
      window.removeEventListener('scroll', throttledMeasure, true);
    };
  }, [open, measure]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      } else if (event.key === 'ArrowRight') {
        setStepIndex(Math.min(stepIndex + 1, steps.length - 1));
      } else if (event.key === 'ArrowLeft') {
        setStepIndex(Math.max(stepIndex - 1, 0));
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, close, stepIndex, steps.length, setStepIndex]);

  if (!open || !step) {
    return null;
  }

  const veil = 'fixed z-[100] bg-black/80 transition-all duration-150';

  return (
    <div aria-hidden={false} role="dialog" aria-label="Page tour">
      {rect && (
        <>
          <div className={veil} style={{ inset: 0, height: rect.top }} />
          <div
            className={veil}
            style={{ left: 0, right: 0, bottom: 0, top: rect.bottom }}
          />
          <div
            className={veil}
            style={{
              top: rect.top,
              height: rect.height,
              left: 0,
              width: rect.left,
            }}
          />
          <div
            className={veil}
            style={{
              top: rect.top,
              height: rect.height,
              left: rect.right,
              right: 0,
            }}
          />
          <div
            className="border-accent-cyan ring-accent-cyan/40 pointer-events-none fixed z-[101] rounded-lg border-2 ring-4 transition-all duration-150"
            style={{
              top: rect.top - 4,
              left: rect.left - 4,
              width: rect.width + 8,
              height: rect.height + 8,
            }}
          />
        </>
      )}

      <div className="border-border bg-background pointer-events-auto fixed bottom-8 left-1/2 z-[102] w-[min(90vw,420px)] -translate-x-1/2 rounded-xl border p-4 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-display text-sm font-bold">{step.label}</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close tour"
            className="text-foreground-secondary hover:text-foreground -mt-1 -mr-1 rounded p-1"
          >
            <XIcon size={16} />
          </button>
        </div>
        <p className="text-foreground-secondary mt-1.5 text-sm">
          {step.description}
        </p>

        {steps.length > 1 && (
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex(stepIndex - 1)}
              className="text-foreground-secondary hover:text-foreground inline-flex items-center gap-1 text-xs font-medium disabled:opacity-30"
            >
              <ChevronLeftIcon size={14} aria-hidden />
              Back
            </button>
            <div className="flex items-center gap-1">
              {steps.map((s, index) => (
                <span
                  key={s.id}
                  className={cn(
                    'size-1.5 rounded-full',
                    index === stepIndex ? 'bg-primary' : 'bg-border',
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              disabled={stepIndex === steps.length - 1}
              onClick={() => setStepIndex(stepIndex + 1)}
              className="text-foreground-secondary hover:text-foreground inline-flex items-center gap-1 text-xs font-medium disabled:opacity-30"
            >
              Next
              <ChevronRightIcon size={14} aria-hidden />
            </button>
          </div>
        )}

        <p className="text-foreground-secondary mt-2.5 text-[10px]">
          Press{' '}
          <kbd className="border-border rounded border px-1 py-0.5">H</kbd> or{' '}
          <kbd className="border-border rounded border px-1 py-0.5">Esc</kbd> to
          close
          {steps.length > 1 ? ' · ← → to move' : ''}
        </p>
      </div>
    </div>
  );
}
