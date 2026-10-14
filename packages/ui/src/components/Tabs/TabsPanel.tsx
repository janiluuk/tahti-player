import { TabPanel } from '@headlessui/react';
import { motion, useReducedMotion } from 'motion/react';
import { FC, PropsWithChildren } from 'react';

import { cn } from '../../utils';
import { ScrollableArea } from '../ScrollableArea';
import { useTabsContext } from './context';

type TabsPanelProps = PropsWithChildren<{
  className?: string;
}>;

// A short fade-in on mount, not a coordinated enter/exit: Headless UI
// unmounts the previous panel synchronously as this one mounts, so there is
// no old panel left to animate out. That keeps tab switches cheap (no
// AnimatePresence-driven delay) while still giving the swap some motion.
export const TabsPanel: FC<TabsPanelProps> = ({ children, className }) => {
  const { panelClassName } = useTabsContext();
  const reducedMotion = useReducedMotion();
  return (
    <TabPanel
      className={cn(
        'focus-visible:ring-primary relative flex-1 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset',
        panelClassName,
        className,
      )}
    >
      <motion.div
        className="h-full"
        initial={reducedMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.14, ease: 'easeOut' }}
      >
        <ScrollableArea>{children}</ScrollableArea>
      </motion.div>
    </TabPanel>
  );
};
