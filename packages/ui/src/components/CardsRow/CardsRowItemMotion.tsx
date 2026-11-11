import { motion, useReducedMotion } from 'motion/react';
import { forwardRef, type ReactNode } from 'react';

import { cn } from '../../utils';

const EXIT_MS = 0.22;

type CardsRowItemMotionProps = {
  itemId: string;
  as?: 'div' | 'li';
  className?: string;
  children: ReactNode;
};

/** Fades + lightly scales out when a CardsRow item leaves (unfavorite, filter, etc.). */
export const CardsRowItemMotion = forwardRef<
  HTMLDivElement & HTMLLIElement,
  CardsRowItemMotionProps
>(function CardsRowItemMotion(
  { itemId, as = 'div', className, children },
  ref,
) {
  const reduceMotion = useReducedMotion();
  const MotionTag = as === 'li' ? motion.li : motion.div;

  return (
    <MotionTag
      ref={ref}
      layout={!reduceMotion}
      initial={false}
      animate={{ opacity: 1, scale: 1 }}
      exit={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.96, transition: { duration: EXIT_MS } }
      }
      transition={{ duration: reduceMotion ? 0 : EXIT_MS, ease: 'easeOut' }}
      className={cn(className, 'origin-center')}
      data-cards-row-item={itemId}
      data-testid="cards-row-item-motion"
    >
      {children}
    </MotionTag>
  );
});
