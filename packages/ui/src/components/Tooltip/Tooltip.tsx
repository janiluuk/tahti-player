import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react-dom';
import { FC, PropsWithChildren, ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../../utils';

const TOOLTIP_OFFSET_PX = 12;
const VIEWPORT_PADDING_PX = 8;
const COARSE_POINTER_QUERY = '(pointer: coarse)';

type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * Safe wrapper around `window.matchMedia` — some jsdom-based test setups
 * leave `matchMedia` undefined, others stub it with a function that
 * returns `undefined` rather than a real `MediaQueryList`. Never let a
 * missing/broken implementation crash the component that calls this.
 */
function safeMatchMedia(query: string): MediaQueryList | null {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return null;
  }
  try {
    return window.matchMedia(query) ?? null;
  } catch {
    return null;
  }
}

/**
 * True on touch-primary devices. Tooltip only opens/closes on
 * mouseenter/mouseleave/focus/blur — a touch tap fires mouseenter (and
 * focus) with no matching mouseleave, so tooltips get stuck open after a
 * tap on coarse-pointer devices. Suppress hover-tooltips there entirely
 * rather than trying to fake a close event.
 */
function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(
    () => safeMatchMedia(COARSE_POINTER_QUERY)?.matches ?? false,
  );

  useEffect(() => {
    const mql = safeMatchMedia(COARSE_POINTER_QUERY);
    if (!mql) {
      return;
    }
    const onChange = () => setCoarse(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return coarse;
}

type TooltipProps = PropsWithChildren<{
  content: ReactNode;
  side?: TooltipSide;
  disabled?: boolean;
  className?: string;
  wrapperClassName?: string;
}>;

export const Tooltip: FC<TooltipProps> = ({
  children,
  content,
  side = 'right',
  disabled = false,
  className,
  wrapperClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const coarsePointer = useCoarsePointer();
  const suppressed = disabled || coarsePointer;
  const { refs, floatingStyles } = useFloating({
    placement: side,
    open: isOpen,
    middleware: [
      offset(TOOLTIP_OFFSET_PX),
      flip(),
      shift({ padding: VIEWPORT_PADDING_PX }),
    ],
    whileElementsMounted: autoUpdate,
  });

  return (
    <div
      ref={refs.setReference}
      className={wrapperClassName}
      onMouseEnter={suppressed ? undefined : () => setIsOpen(true)}
      onMouseLeave={suppressed ? undefined : () => setIsOpen(false)}
      onFocus={suppressed ? undefined : () => setIsOpen(true)}
      onBlur={suppressed ? undefined : () => setIsOpen(false)}
    >
      {children}
      {isOpen &&
        !suppressed &&
        createPortal(
          <div
            ref={refs.setFloating}
            role="tooltip"
            style={floatingStyles}
            className={cn(
              'border-border bg-background text-foreground shadow-shadow pointer-events-none z-50 rounded-md border-(length:--border-width) px-2 py-1 text-sm whitespace-nowrap',
              className,
            )}
          >
            {content}
          </div>,
          document.body,
        )}
    </div>
  );
};
