import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react-dom';
import { FC, PropsWithChildren, ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../../utils';
import { useMediaQuery } from '../../utils/mediaQuery';

const TOOLTIP_OFFSET_PX = 12;
const VIEWPORT_PADDING_PX = 8;
const COARSE_POINTER_QUERY = '(pointer: coarse)';

type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * True on touch-primary devices. Tooltip only opens/closes on
 * mouseenter/mouseleave/focus/blur — a touch tap fires mouseenter (and
 * focus) with no matching mouseleave, so tooltips get stuck open after a
 * tap on coarse-pointer devices. Suppress hover-tooltips there entirely
 * rather than trying to fake a close event.
 */
const useCoarsePointer = () => useMediaQuery(COARSE_POINTER_QUERY);

export type TooltipProps = PropsWithChildren<{
  content: ReactNode;
  side?: TooltipSide;
  disabled?: boolean;
  className?: string;
  wrapperClassName?: string;
  /** Wrap long text at a readable width instead of one long line. */
  multiline?: boolean;
}>;

/** The floating bubble; positioning only runs while a tooltip is actually open. */
const TooltipBubble: FC<{
  anchor: HTMLElement | null;
  side: TooltipSide;
  multiline: boolean;
  className?: string;
  children: ReactNode;
}> = ({ anchor, side, multiline, className, children }) => {
  const { refs, floatingStyles } = useFloating({
    placement: side,
    open: true,
    elements: { reference: anchor },
    middleware: [
      offset(TOOLTIP_OFFSET_PX),
      flip(),
      shift({ padding: VIEWPORT_PADDING_PX }),
    ],
    whileElementsMounted: autoUpdate,
  });
  return createPortal(
    <div
      ref={refs.setFloating}
      role="tooltip"
      style={floatingStyles}
      className={cn(
        'border-border bg-background text-foreground shadow-shadow pointer-events-none z-50 rounded-md border-(length:--border-width) px-2 py-1 text-sm whitespace-nowrap',
        multiline && 'max-w-xs whitespace-normal',
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
};

export const Tooltip: FC<TooltipProps> = ({
  children,
  content,
  side = 'right',
  disabled = false,
  className,
  wrapperClassName,
  multiline = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const coarsePointer = useCoarsePointer();
  const suppressed = disabled || coarsePointer;

  return (
    <div
      ref={setAnchor}
      className={wrapperClassName}
      onMouseEnter={suppressed ? undefined : () => setIsOpen(true)}
      onMouseLeave={suppressed ? undefined : () => setIsOpen(false)}
      onFocus={suppressed ? undefined : () => setIsOpen(true)}
      onBlur={suppressed ? undefined : () => setIsOpen(false)}
    >
      {children}
      {isOpen && !suppressed && (
        <TooltipBubble
          anchor={anchor}
          side={side}
          multiline={multiline}
          className={className}
        >
          {content}
        </TooltipBubble>
      )}
    </div>
  );
};
