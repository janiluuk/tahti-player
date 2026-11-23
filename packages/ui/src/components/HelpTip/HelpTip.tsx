import { CircleHelpIcon } from 'lucide-react';
import { FC, useId } from 'react';

import { cn } from '../../utils';
import { Tooltip, type TooltipProps } from '../Tooltip/Tooltip';

type HelpTipProps = {
  /** The explanation, shown in the bubble and read as the description. */
  content: string;
  /** Accessible name of the icon button, e.g. "About dynamic theme". */
  label: string;
  side?: TooltipProps['side'];
  className?: string;
};

/**
 * A small help icon that shows `content` in a tooltip on hover or keyboard
 * focus, so settings can keep one-line labels and tuck the explanation away.
 * The text is also the button's accessible description for screen readers.
 */
export const HelpTip: FC<HelpTipProps> = ({
  content,
  label,
  side = 'top',
  className,
}) => {
  const descriptionId = useId();
  return (
    <>
      <Tooltip content={content} side={side}>
        <button
          type="button"
          aria-label={label}
          aria-describedby={descriptionId}
          data-testid="help-tip"
          className={cn(
            'text-foreground-secondary hover:text-foreground focus-visible:ring-primary inline-flex size-5 shrink-0 cursor-help items-center justify-center rounded-full outline-none focus-visible:ring-2',
            className,
          )}
        >
          <CircleHelpIcon size={14} aria-hidden />
        </button>
      </Tooltip>
      <span id={descriptionId} className="sr-only">
        {content}
      </span>
    </>
  );
};
