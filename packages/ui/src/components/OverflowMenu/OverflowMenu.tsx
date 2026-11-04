import { MoreHorizontalIcon } from 'lucide-react';
import { FC, ReactElement, ReactNode } from 'react';

import { Button } from '../Button';
import { Popover } from '../Popover';

export type OverflowMenuItem = {
  id: string;
  label: string;
  onSelect: () => void;
  destructive?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
};

export type OverflowMenuProps = {
  items: readonly OverflowMenuItem[];
  /** Accessible name for the menu, e.g. "More actions". */
  label?: string;
  /** Custom trigger; defaults to a ⋯ icon button. */
  trigger?: ReactElement;
  'data-testid'?: string;
};

/** Compact ⋯ menu for secondary page/row actions. Prefer one primary
 * Button beside ViewShell title; put the rest here. */
export const OverflowMenu: FC<OverflowMenuProps> = ({
  items,
  label = 'More actions',
  trigger,
  'data-testid': testId = 'overflow-menu',
}) => (
  <Popover
    anchor="bottom end"
    tooltip={{ content: label, side: 'top' }}
    trigger={
      trigger ?? (
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label={label}
          data-testid={testId}
        >
          <MoreHorizontalIcon size={16} aria-hidden />
        </Button>
      )
    }
    panelClassName="min-w-44 px-0 py-0"
  >
    <Popover.Menu aria-label={label}>
      {items.map((item) => (
        <Popover.Item
          key={item.id}
          intent={item.destructive ? 'danger' : 'default'}
          icon={item.icon}
          disabled={item.disabled}
          closeOnClick
          onClick={item.onSelect}
        >
          {item.label}
        </Popover.Item>
      ))}
    </Popover.Menu>
  </Popover>
);
