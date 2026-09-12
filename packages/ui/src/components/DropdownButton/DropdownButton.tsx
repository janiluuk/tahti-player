import { PopoverPanelProps } from '@headlessui/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import { FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';
import { Popover } from '../Popover';

export type DropdownButtonItem = {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  intent?: 'default' | 'danger';
};

const triggerVariants = cva('gap-1.5', {
  variants: {
    variant: {
      default: '',
      secondary: '',
    },
  },
  defaultVariants: {
    variant: 'secondary',
  },
});

export type DropdownButtonProps = {
  /** Trigger label — usually names the group ("More", "Save options"). Can
   * be a short symbol (e.g. "…") when the trigger sits in a tight toolbar —
   * pass `aria-label` too in that case, since a symbol alone isn't
   * announced meaningfully by a screen reader. */
  label: ReactNode;
  icon?: ReactNode;
  items: DropdownButtonItem[];
  variant?: VariantProps<typeof triggerVariants>['variant'];
  disabled?: boolean;
  className?: string;
  anchor?: PopoverPanelProps['anchor'];
  'aria-label'?: string;
};

/** A single trigger that expands into a menu of related action variants —
 * for collapsing a row of "same action, different flavor" buttons (Save /
 * Save as… / Reset, Export / Export as…) into one control instead of N
 * buttons competing for attention. Not for unrelated actions — those stay
 * as their own buttons. */
export const DropdownButton: FC<DropdownButtonProps> = ({
  label,
  icon,
  items,
  variant = 'secondary',
  disabled,
  className,
  anchor = 'bottom end',
  'aria-label': ariaLabel,
}) => (
  <Popover
    anchor={anchor}
    trigger={
      <Button
        type="button"
        variant={variant}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(triggerVariants({ variant }), className)}
      >
        {icon}
        {label}
        <ChevronDown size={16} className="opacity-70" />
      </Button>
    }
  >
    <Popover.Menu>
      {items.map((item) => (
        <Popover.Item
          key={item.id}
          icon={item.icon}
          intent={item.intent}
          disabled={item.disabled}
          onClick={item.onClick}
        >
          {item.label}
        </Popover.Item>
      ))}
    </Popover.Menu>
  </Popover>
);
