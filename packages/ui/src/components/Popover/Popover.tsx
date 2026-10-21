import {
  Popover as HeadlessPopover,
  PopoverBackdrop,
  PopoverPanel,
  PopoverPanelProps,
} from '@headlessui/react';
import { AnimatePresence, motion } from 'motion/react';
import { FC, ReactElement, ReactNode } from 'react';

import { cn } from '../../utils';
import { ClickTrigger, PopoverTooltip } from './ClickTrigger';
import { ContextMenuTrigger } from './ContextMenuTrigger';
import { PopoverFooter } from './PopoverFooter';
import { PopoverItem } from './PopoverItem';
import { PopoverMenu } from './PopoverMenu';
import { PopoverSection } from './PopoverSection';

export type PopoverProps = {
  trigger: ReactElement;
  tooltip?: PopoverTooltip;
  children: ReactNode;
  className?: string;
  panelClassName?: string;
  anchor?: PopoverPanelProps['anchor'];
  backdrop?: boolean;
  triggerOn?: 'click' | 'contextmenu';
};

type PopoverComponent = FC<PopoverProps> & {
  Item: typeof PopoverItem;
  Menu: typeof PopoverMenu;
  Section: typeof PopoverSection;
  Footer: typeof PopoverFooter;
};

const PopoverImpl: FC<PopoverProps> = ({
  trigger,
  children,
  className,
  panelClassName,
  anchor,
  backdrop,
  triggerOn = 'click',
  tooltip,
}) => {
  return (
    <HeadlessPopover className={cn('relative', className)}>
      {({ open }) => (
        <>
          {triggerOn === 'contextmenu' ? (
            <ContextMenuTrigger>{trigger}</ContextMenuTrigger>
          ) : (
            <ClickTrigger tooltip={tooltip}>{trigger}</ClickTrigger>
          )}
          <AnimatePresence>
            {open && (
              <>
                {backdrop && (
                  <PopoverBackdrop
                    transition
                    className="fixed inset-0 bg-black/20 transition duration-150 ease-out data-closed:opacity-0"
                  />
                )}
                <PopoverPanel
                  static
                  as={motion.div}
                  initial={{ opacity: 0, y: 4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 8, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  className={cn(
                    'text-primary-foreground bg-primary border-border rounded-md border-(length:--border-width) px-4 py-2 leading-5 select-none',
                    panelClassName,
                    {
                      ['translate-y-0']: anchor === 'bottom',
                      ['-translate-y-4']: anchor === 'top',
                      ['translate-x-2 -translate-y-2']: anchor === 'right',
                      ['-translate-x-2 -translate-y-2']: anchor === 'left',
                    },
                  )}
                  anchor={anchor}
                >
                  {children}
                </PopoverPanel>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </HeadlessPopover>
  );
};

export const Popover = PopoverImpl as PopoverComponent;
Popover.Item = PopoverItem;
Popover.Menu = PopoverMenu;
Popover.Section = PopoverSection;
Popover.Footer = PopoverFooter;
