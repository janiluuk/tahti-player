import { Input as HeadlessInput } from '@headlessui/react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  ComponentPropsWithoutRef,
  forwardRef,
  useId,
  type ReactNode,
} from 'react';

import { cn } from '../../utils';

const inputVariants = cva(
  'border-border text-foreground placeholder:text-foreground-secondary focus-visible:ring-primary focus-visible:ring-offset-background w-full px-3 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
  {
    variants: {
      variant: {
        text: '',
        number: '',
        password: '',
        borderless:
          'border-b-border !rounded-none rounded-none !border-r-0 !border-l-0 border-t-transparent px-6 outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
        color:
          'h-9 w-11 cursor-pointer rounded border-0 bg-transparent p-0 focus-visible:ring-offset-0',
      },
      tone: {
        primary: 'bg-background-input',
        secondary: 'bg-background',
      },
      size: {
        sm: 'h-9 text-sm',
        default: 'h-10',
        lg: 'h-11 text-lg',
      },
      state: {
        normal: '',
        error: 'border-accent-red',
      },
      withAddon: {
        false: 'rounded-md border-(length:--border-width)',
        true: 'min-w-0 flex-1 rounded-l border-0 focus-visible:ring-0 focus-visible:ring-offset-0',
      },
    },
    defaultVariants: {
      variant: 'text',
      tone: 'primary',
      size: 'default',
      state: 'normal',
      withAddon: false,
    },
  },
);

const LAYOUT_CLASS =
  /^-?(?:w|min-w|max-w|flex|grow|shrink|basis|self|order|col-span|row-span|m[trblxy]?)(?:-|$)/;

/** With an addon the visible frame is a wrapper, not the `<input>`, so
 * sizing and spacing classes must move to the root or the frame and the
 * field end up different widths. */
function splitLayoutClasses(className: string | undefined) {
  const layout: string[] = [];
  const field: string[] = [];
  for (const token of (className ?? '').split(/\s+/).filter(Boolean)) {
    const utility = token.slice(token.lastIndexOf(':') + 1).replace(/^!/, '');
    if (LAYOUT_CLASS.test(utility)) {
      layout.push(token);
    } else {
      field.push(token);
    }
  }
  return { layout: layout.join(' '), field: field.join(' ') };
}

type InputProps = Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'size'> &
  VariantProps<typeof inputVariants> & {
    type?:
      | 'text'
      | 'search'
      | 'number'
      | 'password'
      | 'date'
      | 'time'
      | 'datetime-local'
      | 'color';
    label?: string;
    description?: string;
    error?: string;
    startAddon?: ReactNode;
    endAddon?: ReactNode;
  };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    description,
    error,
    variant,
    type,
    tone = 'primary',
    size,
    className,
    startAddon,
    endAddon,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? `input-${reactId}`;
  const labelId = `${inputId}-label`;
  const descriptionId = `${inputId}-description`;
  const errorId = `${inputId}-error`;

  const describedBy = [
    description ? descriptionId : null,
    error ? errorId : null,
  ]
    .filter(Boolean)
    .join(' ');

  const state = error ? 'error' : 'normal';
  const resolvedVariant = variant ?? (type === 'color' ? 'color' : 'text');
  const inputType = type ?? resolvedVariant;
  const hasAddon = Boolean(startAddon || endAddon);
  const { layout: rootClassName, field: fieldClassName } = hasAddon
    ? splitLayoutClasses(className)
    : { layout: '', field: className };

  const field = (
    <HeadlessInput
      as="input"
      id={inputId}
      ref={ref}
      type={inputType}
      aria-labelledby={label ? labelId : undefined}
      aria-describedby={describedBy || undefined}
      aria-invalid={!!error || undefined}
      aria-errormessage={error ? errorId : undefined}
      inputMode={resolvedVariant === 'number' ? 'numeric' : undefined}
      invalid={!!error}
      className={cn(
        inputVariants({
          variant: resolvedVariant,
          size,
          tone,
          state,
          withAddon: hasAddon,
          className: fieldClassName,
        }),
      )}
      {...rest}
    />
  );

  return (
    <div
      className={cn(
        resolvedVariant === 'color'
          ? 'flex shrink-0 flex-col gap-2'
          : 'flex w-full flex-col gap-2',
        rootClassName,
      )}
    >
      {label && (
        <label
          htmlFor={inputId}
          id={labelId}
          className="text-foreground text-sm font-semibold"
        >
          {label}
        </label>
      )}
      {hasAddon ? (
        <div className="border-border has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-background inline-flex w-full items-stretch overflow-hidden rounded-md border-(length:--border-width) has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2">
          {startAddon ? (
            <div className="bg-background-secondary text-foreground-secondary border-border flex max-w-[55%] min-w-0 items-center border-r-(length:--border-width) px-3 text-xs">
              {startAddon}
            </div>
          ) : null}
          {field}
          {endAddon ? (
            <div className="bg-primary text-primary-foreground border-border flex items-center gap-2 border-l-(length:--border-width) px-3 text-sm">
              {endAddon}
            </div>
          ) : null}
        </div>
      ) : (
        field
      )}
      {description && (
        <p
          id={descriptionId}
          className="text-foreground-secondary text-sm select-none"
        >
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-accent-red-strong text-xs select-none">
          {error}
        </p>
      )}
    </div>
  );
});
