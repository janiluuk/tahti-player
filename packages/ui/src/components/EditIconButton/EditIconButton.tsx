import { createLink } from '@tanstack/react-router';
import { CheckIcon, PencilIcon } from 'lucide-react';
import {
  ComponentProps,
  ComponentPropsWithoutRef,
  FC,
  forwardRef,
} from 'react';

import { cn } from '../../utils';
import { Button, buttonVariants } from '../Button/Button';
import { Tooltip } from '../Tooltip';
import { useUiLabels } from '../UiLabels';

export type EditIconButtonProps = Omit<
  ComponentProps<typeof Button>,
  'children' | 'size'
> & {
  /** Accessible name and tooltip, e.g. "Edit details" or "Edit Night Drive". */
  label?: string;
  /** Turns the button into an edit-mode toggle: a check icon and `doneLabel` while on. */
  editing?: boolean;
  /** Name and tooltip while `editing` is true. */
  doneLabel?: string;
  /** Tooltip side; `false` renders the button without a tooltip. */
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right' | false;
};

/** The app-wide "edit this" action: a pencil icon button with a tooltip. */
export const EditIconButton: FC<EditIconButtonProps> = ({
  label,
  editing,
  doneLabel,
  tooltipSide = 'top',
  variant,
  ...props
}) => {
  const labels = useUiLabels();
  const isToggle = editing !== undefined;
  const name = editing
    ? (doneLabel ?? labels.doneEditing)
    : (label ?? labels.edit);
  const button = (
    <Button
      size="icon-sm"
      variant={variant ?? (editing ? 'default' : 'secondary')}
      aria-label={name}
      aria-pressed={isToggle ? editing : undefined}
      {...props}
    >
      {editing ? (
        <CheckIcon size={14} aria-hidden />
      ) : (
        <PencilIcon size={14} aria-hidden />
      )}
    </Button>
  );
  return tooltipSide === false ? (
    button
  ) : (
    <Tooltip content={name} side={tooltipSide}>
      {button}
    </Tooltip>
  );
};

type EditIconAnchorProps = ComponentPropsWithoutRef<'a'> & {
  label?: string;
  variant?: ComponentProps<typeof Button>['variant'];
};

const EditIconAnchor = forwardRef<HTMLAnchorElement, EditIconAnchorProps>(
  function EditIconAnchor(
    { label, variant = 'secondary', className, ...rest },
    ref,
  ) {
    const labels = useUiLabels();
    const name = label ?? labels.edit;
    return (
      <Tooltip content={name} side="top">
        <a
          ref={ref}
          aria-label={name}
          className={cn(
            buttonVariants({ variant, size: 'icon-sm' }),
            className,
          )}
          {...rest}
        >
          <PencilIcon size={14} aria-hidden />
        </a>
      </Tooltip>
    );
  },
);

/** `EditIconButton` as a router link, for "Edit" actions that open another page. */
export const EditIconLink = createLink(EditIconAnchor);
