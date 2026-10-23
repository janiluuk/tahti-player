import { cva, type VariantProps } from 'class-variance-authority';
import { ComponentProps, forwardRef, useId } from 'react';

import { cn } from '../../utils';

const textareaVariants = cva(
  'border-border text-foreground placeholder:text-foreground-secondary focus-visible:ring-primary focus-visible:ring-offset-background w-full resize-y rounded-md border-(length:--border-width) px-3 py-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
  {
    variants: {
      tone: {
        primary: 'bg-background-input',
        secondary: 'bg-background',
      },
      state: {
        normal: '',
        error: 'border-accent-red',
      },
    },
    defaultVariants: {
      tone: 'primary',
      state: 'normal',
    },
  },
);

type TextareaProps = ComponentProps<'textarea'> &
  Omit<VariantProps<typeof textareaVariants>, 'state'> & {
    /** Visible label, wired like `Input`'s. Without label, description and
     * error the bare textarea renders, as before. */
    label?: string;
    description?: string;
    error?: string;
    /** Class for the label/description wrapper (e.g. a grid span). */
    fieldClassName?: string;
  };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      tone,
      className,
      id,
      label,
      description,
      error,
      fieldClassName,
      ...props
    },
    ref,
  ) {
    const reactId = useId();
    const textareaId = id ?? `textarea-${reactId}`;
    const descriptionId = `${textareaId}-description`;
    const errorId = `${textareaId}-error`;
    const describedBy = [
      description ? descriptionId : null,
      error ? errorId : null,
      props['aria-describedby'] ?? null,
    ]
      .filter(Boolean)
      .join(' ');

    const field = (
      <textarea
        ref={ref}
        id={label || description || error ? textareaId : id}
        className={cn(
          textareaVariants({
            tone,
            state: error ? 'error' : 'normal',
            className,
          }),
        )}
        {...props}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : props['aria-invalid']}
        aria-errormessage={error ? errorId : props['aria-errormessage']}
      />
    );

    if (!label && !description && !error) {
      return field;
    }

    return (
      <div className={cn('flex w-full flex-col gap-2', fieldClassName)}>
        {label ? (
          <label
            htmlFor={textareaId}
            className="text-foreground text-sm font-semibold"
          >
            {label}
          </label>
        ) : null}
        {field}
        {description ? (
          <p
            id={descriptionId}
            className="text-foreground-secondary text-sm select-none"
          >
            {description}
          </p>
        ) : null}
        {error ? (
          <p
            id={errorId}
            className="text-accent-red-strong text-xs select-none"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
