import { CheckIcon, ChevronDownIcon, CircleAlertIcon } from 'lucide-react';
import { useId, useState, type FC, type ReactNode } from 'react';

import { cn } from '../../utils';

export type StepStatus = 'complete' | 'current' | 'upcoming' | 'error';

export type StepperStep = {
  id: string;
  title: string;
  /** Short line under the title. A complete step without one shows the
   * `complete` status label (e.g. "Done"). */
  caption?: ReactNode;
  status: StepStatus;
  /** Makes the step a link; otherwise it is a button when `onSelect` is set. */
  href?: string;
};

export type StepperLinkArgs = {
  href: string;
  className: string;
  'aria-current'?: 'step';
  children: ReactNode;
};

/** Below `md` (768px) the list folds into one disclosure button. */
export type StepperCollapse = 'never' | 'mobile' | 'always';

export type StepperProps = {
  steps: StepperStep[];
  /** Localized status words, read out with each step's name. */
  statusLabels: Record<StepStatus, string>;
  'aria-label': string;
  /** Selects a step that has no `href`. */
  onSelect?: (stepId: string) => void;
  /** Wraps a step with an `href` in a link, e.g. a router Link. Defaults to a
   * plain anchor. */
  renderLink?: (args: StepperLinkArgs) => ReactNode;
  collapse?: StepperCollapse;
  /** Text of the folded control, e.g. "Step 1 of 6: Show info". */
  collapsedLabel?: (position: number, total: number, title: string) => string;
  className?: string;
};

const defaultLink = ({ children, ...rest }: StepperLinkArgs) => (
  <a {...rest}>{children}</a>
);

const defaultCollapsedLabel = (
  position: number,
  total: number,
  title: string,
) => `Step ${position} of ${total}: ${title}`;

const ROW_CLASS =
  'flex min-h-11 w-full items-start gap-3 rounded-control px-3 py-2 text-left no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none';

const INDICATOR_CLASS =
  'flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums';

const StepIndicator: FC<{ status: StepStatus; position: number }> = ({
  status,
  position,
}) => {
  if (status === 'complete') {
    return (
      <span
        aria-hidden
        className={cn(
          INDICATOR_CLASS,
          'bg-background-input text-primary-strong',
        )}
      >
        <CheckIcon className="size-4" strokeWidth={3} />
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span
        aria-hidden
        className={cn(INDICATOR_CLASS, 'text-accent-red-strong')}
      >
        <CircleAlertIcon className="size-6" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        INDICATOR_CLASS,
        status === 'current'
          ? 'text-foreground ring-foreground ring-2'
          : 'text-foreground-secondary ring-border-input ring-1',
      )}
    >
      {position}
    </span>
  );
};

function currentIndex(steps: StepperStep[]): number {
  const current = steps.findIndex((step) => step.status === 'current');
  if (current >= 0) {
    return current;
  }
  const open = steps.findIndex((step) => step.status !== 'complete');
  return open >= 0 ? open : steps.length - 1;
}

/** Vertical list of the steps in a task, each a link or button with its
 * number (or check / error icon), title, caption and status. */
export const Stepper: FC<StepperProps> = ({
  steps,
  statusLabels,
  'aria-label': ariaLabel,
  onSelect,
  renderLink = defaultLink,
  collapse = 'mobile',
  collapsedLabel = defaultCollapsedLabel,
  className,
}) => {
  const listId = useId();
  const [expanded, setExpanded] = useState(false);
  const active = currentIndex(steps);
  const activeStep = steps[active];

  return (
    <div data-testid="stepper" className={className}>
      {collapse !== 'never' && activeStep ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((open) => !open)}
          className={cn(
            ROW_CLASS,
            'border-border-input bg-background-secondary items-center border font-semibold',
            collapse === 'mobile' && 'md:hidden',
          )}
        >
          <span className="min-w-0 flex-1 truncate">
            {collapsedLabel(active + 1, steps.length, activeStep.title)}
          </span>
          <ChevronDownIcon
            aria-hidden
            className={cn(
              'size-4 shrink-0 transition-transform motion-reduce:transition-none',
              expanded && 'rotate-180',
            )}
          />
        </button>
      ) : null}
      <ol
        id={listId}
        aria-label={ariaLabel}
        className={cn(
          'flex flex-col gap-1',
          collapse !== 'never' && 'mt-1',
          collapse === 'always' && !expanded && 'hidden',
          collapse === 'mobile' && !expanded && 'hidden md:flex',
          collapse === 'mobile' && 'md:mt-0',
        )}
      >
        {steps.map((step, index) => {
          const current = step.status === 'current';
          const showStatusAsCaption =
            step.caption === undefined && step.status === 'complete';
          const caption = showStatusAsCaption
            ? statusLabels.complete
            : step.caption;
          const className = cn(
            ROW_CLASS,
            current
              ? 'bg-background-secondary text-foreground'
              : 'hover:bg-background-secondary/60',
            step.status === 'upcoming' && 'text-foreground-secondary',
          );
          const content = (
            <>
              <StepIndicator status={step.status} position={index + 1} />
              <span className="flex min-w-0 flex-col pt-0.5">
                <span className={cn('text-sm', current && 'font-semibold')}>
                  {step.title}
                </span>
                {/* Whitespace-only text is not drawn in a flex column but
                    keeps the accessible name's words apart. */}{' '}
                {caption !== undefined ? (
                  <span
                    className={cn(
                      'text-xs',
                      step.status === 'error'
                        ? 'text-accent-red-strong'
                        : 'text-foreground-secondary',
                    )}
                  >
                    {caption}
                  </span>
                ) : null}{' '}
                {showStatusAsCaption ? null : (
                  <span className="sr-only">{statusLabels[step.status]}</span>
                )}
              </span>
            </>
          );
          const ariaCurrent = current ? ('step' as const) : undefined;
          let row: ReactNode;
          if (step.href) {
            row = renderLink({
              href: step.href,
              className,
              'aria-current': ariaCurrent,
              children: content,
            });
          } else if (onSelect) {
            row = (
              <button
                type="button"
                aria-current={ariaCurrent}
                onClick={() => onSelect(step.id)}
                className={cn(className, 'cursor-pointer')}
              >
                {content}
              </button>
            );
          } else {
            row = (
              <div aria-current={ariaCurrent} className={className}>
                {content}
              </div>
            );
          }
          return (
            <li
              key={step.id}
              data-testid={`stepper-step-${step.id}`}
              data-status={step.status}
            >
              {row}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
